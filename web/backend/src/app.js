import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import { analyze, simulate } from './calculator.js';
import { REFERENCE, COMPARISONS } from './referenceData.js';
import { DEMO } from './demo.js';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '50kb' }));

const fail = (msg, status = 400) => Object.assign(new Error(msg), { status, expose: true });
const validKey = (k) => typeof k === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(k);
const validId = (s) => { const n = Number(s); if (!Number.isInteger(n) || n < 1) throw fail('Invalid id'); return n; };

function loadAssessment(id) {
  const row = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id);
  if (!row) throw fail('Assessment not found', 404);
  const goal = db.prepare('SELECT target_lpd FROM goals WHERE assessment_id = ?').get(id);
  const actions = Object.fromEntries(db.prepare('SELECT action_id, completed FROM actions WHERE assessment_id = ?').all(id).map((x) => [x.action_id, !!x.completed]));
  const sim = db.prepare('SELECT changes_json, original_usage, simulated_usage, daily_saving, yearly_saving, created_at FROM simulations WHERE assessment_id = ? ORDER BY id DESC LIMIT 1').get(id);
  return { id: row.id, isDemo: !!row.is_demo, createdAt: row.created_at, ...JSON.parse(row.results_json),
    goal: goal ? goal.target_lpd : null, actions,
    savedSimulation: sim ? { changes: JSON.parse(sim.changes_json), current: sim.original_usage, after: sim.simulated_usage, daily: sim.daily_saving, yearly: sim.yearly_saving } : null };
}

app.get('/api/health', (req, res) => { db.prepare('SELECT 1').get(); res.json({ ok: true }); });
app.get('/api/reference', (req, res) => res.json({ reference: REFERENCE, comparisons: COMPARISONS }));
app.get('/api/demo', (req, res) => res.json(DEMO));

app.post('/api/assessment', (req, res) => {
  const { householdKey, answers, isDemo } = req.body || {};
  if (!validKey(householdKey)) throw fail('Missing or invalid householdKey');
  const result = analyze(answers);
  const info = db.prepare(`INSERT INTO assessments (household_key,is_demo,answers_json,daily_usage,per_person_usage,conservation_score,benchmark_status,results_json)
    VALUES (?,?,?,?,?,?,?,?)`).run(householdKey, isDemo ? 1 : 0, JSON.stringify(result.answers), result.total, result.perPerson, result.score.points, result.benchmark.status, JSON.stringify(result));
  res.status(201).json(loadAssessment(info.lastInsertRowid));
});

app.get('/api/assessment/:id', (req, res) => res.json(loadAssessment(validId(req.params.id))));

// UPDATE — re-run the calculation engine with new answers, persist the result
app.put('/api/assessment/:id', (req, res) => {
  const id = validId(req.params.id);
  const row = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id);
  if (!row) throw fail('Assessment not found', 404);
  const { answers } = req.body || {};
  const result = analyze(answers);
  db.prepare(`UPDATE assessments
    SET answers_json=?, daily_usage=?, per_person_usage=?, conservation_score=?, benchmark_status=?, results_json=?
    WHERE id=?`).run(JSON.stringify(result.answers), result.total, result.perPerson, result.score.points, result.benchmark.status, JSON.stringify(result), id);
  res.json(loadAssessment(id));
});

// DELETE — cascades to simulations, goals, actions via FK
app.delete('/api/assessment/:id', (req, res) => {
  const id = validId(req.params.id);
  const row = db.prepare('SELECT id FROM assessments WHERE id = ?').get(id);
  if (!row) throw fail('Assessment not found', 404);
  db.prepare('DELETE FROM assessments WHERE id = ?').run(id);
  res.json({ deleted: id });
});

app.post('/api/calculate', (req, res) => res.json(analyze(req.body && req.body.answers))); // stateless preview

app.post('/api/simulation', (req, res) => {
  const { assessmentId, changes, save } = req.body || {};
  const id = validId(assessmentId);
  const row = db.prepare('SELECT answers_json FROM assessments WHERE id = ?').get(id);
  if (!row) throw fail('Assessment not found', 404);
  const sim = simulate(JSON.parse(row.answers_json), changes || {});
  if (save) db.prepare('INSERT INTO simulations (assessment_id,changes_json,original_usage,simulated_usage,daily_saving,yearly_saving) VALUES (?,?,?,?,?,?)')
    .run(id, JSON.stringify(sim.changes), sim.current, sim.after, sim.saving.daily, sim.saving.yearly);
  res.json({ ...sim, saved: !!save });
});

app.put('/api/assessment/:id/goal', (req, res) => {
  const id = validId(req.params.id);
  const t = Number(req.body && req.body.targetLpd);
  if (![10, 20, 30, 50].includes(t)) throw fail('Goal must be 10, 20, 30 or 50 L/day');
  loadAssessment(id);
  db.prepare(`INSERT INTO goals (assessment_id,target_lpd) VALUES (?,?) ON CONFLICT(assessment_id) DO UPDATE SET target_lpd=excluded.target_lpd, updated_at=CURRENT_TIMESTAMP`).run(id, t);
  res.json({ goal: t });
});

app.put('/api/assessment/:id/actions/:actionId', (req, res) => {
  const id = validId(req.params.id);
  const aid = String(req.params.actionId);
  if (!/^[a-z_]{2,40}$/.test(aid)) throw fail('Invalid action');
  if (typeof (req.body && req.body.completed) !== 'boolean') throw fail('completed must be true or false');
  const done = req.body.completed;
  loadAssessment(id);
  db.prepare(`INSERT INTO actions (assessment_id,action_id,completed,completed_at) VALUES (?,?,?,CASE WHEN ? THEN CURRENT_TIMESTAMP END)
    ON CONFLICT(assessment_id,action_id) DO UPDATE SET completed=excluded.completed, completed_at=excluded.completed_at`).run(id, aid, done ? 1 : 0, done ? 1 : 0);
  res.json({ actionId: aid, completed: done });
});

app.get('/api/progress/:key', (req, res) => {
  if (!validKey(req.params.key)) throw fail('Invalid household key');
  const rows = db.prepare('SELECT id, created_at, is_demo, daily_usage, per_person_usage, conservation_score FROM assessments WHERE household_key = ? ORDER BY id').all(req.params.key);
  const list = rows.map((r) => ({ id: r.id, createdAt: r.created_at, isDemo: !!r.is_demo, total: r.daily_usage, perPerson: r.per_person_usage, score: r.conservation_score }));
  const first = list[0] || null, latest = list[list.length - 1] || null;
  const reduction = first && latest && list.length > 1 ? first.total - latest.total : 0;
  res.json({ assessments: list, first, latest, reduction, reductionPct: first && first.total ? Math.round((reduction / first.total) * 100) : 0 });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.expose) return res.status(err.status || 400).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON in request' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});