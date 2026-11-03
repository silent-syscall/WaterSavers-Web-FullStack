// Integration test — requires `npm install` (uses better-sqlite3 with a temp DB).
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

process.env.DB_PATH = path.join(os.tmpdir(), `ws-test-${Date.now()}.db`);
const { app } = await import('../src/app.js');

test('create -> reload -> simulate -> goal -> progress', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}/api`;
  const j = (p, o) => fetch(base + p, { headers: { 'Content-Type': 'application/json' }, ...o }).then(async (r) => ({ status: r.status, body: await r.json() }));
  const key = 'test-household-abc123';
  try {
    const c = await j('/assessment', { method: 'POST', body: JSON.stringify({ householdKey: key, answers: { people: 3, showerMinutes: 12 } }) });
    assert.equal(c.status, 201);
    const g = await j(`/assessment/${c.body.id}`);
    assert.equal(g.body.total, c.body.total);
    const s = await j('/simulation', { method: 'POST', body: JSON.stringify({ assessmentId: c.body.id, changes: { showerMinutes: 6 }, save: true }) });
    assert.ok(s.body.saving.daily > 0);
    assert.equal((await j(`/assessment/${c.body.id}`)).body.savedSimulation.daily, s.body.saving.daily);
    assert.equal((await j(`/assessment/${c.body.id}/goal`, { method: 'PUT', body: JSON.stringify({ targetLpd: 30 }) })).status, 200);
    assert.equal((await j(`/progress/${key}`)).body.assessments.length, 1);
    assert.equal((await j('/assessment', { method: 'POST', body: JSON.stringify({ householdKey: key, answers: { people: -2 } }) })).status, 400);
    assert.equal((await j('/assessment/99999')).status, 404);
  } finally { server.close(); }
});
