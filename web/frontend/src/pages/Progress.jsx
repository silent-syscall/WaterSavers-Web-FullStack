import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getHouseholdKey } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// EditForm receives the REAL full assessment (including answers) fetched from GET /api/assessment/:id
function EditForm({ assessment, onSave, onCancel }) {
  const orig = assessment.answers;
  const [people, setPeople] = useState(orig.people);
  const [showerMinutes, setShowerMinutes] = useState(orig.showerMinutes);
  const [loadsPerWeek, setLoadsPerWeek] = useState(orig.loadsPerWeek);
  const [gardenDaysPerWeek, setGardenDaysPerWeek] = useState(orig.gardenDaysPerWeek);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSave() {
    setSaving(true);
    setErr('');
    try {
      const updatedAnswers = {
        ...orig,
        people: Number(people),
        showerMinutes: Number(showerMinutes),
        loadsPerWeek: Number(loadsPerWeek),
        gardenDaysPerWeek: Number(gardenDaysPerWeek),
      };
      const updated = await api.updateAssessment(assessment.id, updatedAnswers);
      onSave(updated);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: 'var(--blue-light)',
      border: '1.5px solid var(--blue-mid)',
      borderRadius: 10,
      padding: '1rem 1.25rem',
      marginTop: '.5rem',
    }}>
      <div style={{ fontWeight: 700, marginBottom: '.75rem', fontSize: '.9rem' }}>
        ✏️ Edit key inputs — Assessment #{assessment.id}
      </div>
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
        <div className="field" style={{ minWidth: 130 }}>
          <label className="label">People</label>
          <input className="input" type="number" min={1} max={20} value={people}
            onChange={e => setPeople(e.target.value)} />
        </div>
        {orig.bathMethod === 'shower' && (
          <div className="field" style={{ minWidth: 130 }}>
            <label className="label">Shower (min)</label>
            <input className="input" type="number" min={1} max={60} value={showerMinutes}
              onChange={e => setShowerMinutes(e.target.value)} />
          </div>
        )}
        <div className="field" style={{ minWidth: 130 }}>
          <label className="label">Laundry loads/week</label>
          <input className="input" type="number" min={0} max={30} value={loadsPerWeek}
            onChange={e => setLoadsPerWeek(e.target.value)} />
        </div>
        {orig.hasGarden && (
          <div className="field" style={{ minWidth: 130 }}>
            <label className="label">Garden days/week</label>
            <input className="input" type="number" min={0} max={7} value={gardenDaysPerWeek}
              onChange={e => setGardenDaysPerWeek(e.target.value)} />
          </div>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--gray-500)', marginBottom: '.75rem' }}>
        Other inputs (toilet type, tap habits, etc.) are preserved from the original assessment.
        To change all inputs, create a new assessment.
      </p>
      {err && <div className="alert alert-err" style={{ marginBottom: '.5rem' }}>{err}</div>}
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? '⏳ Saving…' : '💾 Save changes'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Progress() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  // editingId: the assessment id whose form is open
  // editingFull: the full assessment object fetched from GET /api/assessment/:id
  const [editingId, setEditingId] = useState(null);
  const [editingFull, setEditingFull] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api.getProgress(getHouseholdKey()).then(setData).catch(e => setErr(e.message));
  }, []);

  function flash(msg) {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  }

  // Fetch the full assessment (with answers) from the backend, then open the edit form
  async function handleEditClick(id) {
    if (editingId === id) {
      // toggle off
      setEditingId(null);
      setEditingFull(null);
      return;
    }
    setEditLoading(id);
    try {
      const full = await api.getAssessment(id);
      setEditingFull(full);
      setEditingId(id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setEditLoading(null);
    }
  }

  // UPDATE: backend re-ran the calculation; update summary row in local state
  function handleSaved(updated) {
    setData(prev => {
      const assessments = prev.assessments.map(a =>
        a.id === updated.id
          ? { ...a, total: updated.total, perPerson: updated.perPerson, score: updated.score.points }
          : a
      );
      const first = assessments[0] || null;
      const latest = assessments[assessments.length - 1] || null;
      const reduction = first && latest && assessments.length > 1 ? first.total - latest.total : 0;
      return {
        ...prev,
        assessments,
        first,
        latest,
        reduction,
        reductionPct: first && first.total ? Math.round((reduction / first.total) * 100) : 0,
      };
    });
    setEditingId(null);
    setEditingFull(null);
    flash('✓ Assessment updated successfully');
  }

  // DELETE: confirm → call real DELETE API → remove from local state
  async function handleDelete(id) {
    if (!window.confirm(
      `Delete Assessment #${id}?\n\nThis also removes its simulations, goal, and action history. This cannot be undone.`
    )) return;
    setDeletingId(id);
    try {
      await api.deleteAssessment(id);
      setData(prev => {
        const assessments = prev.assessments.filter(a => a.id !== id);
        const first = assessments[0] || null;
        const latest = assessments[assessments.length - 1] || null;
        const reduction = first && latest && assessments.length > 1 ? first.total - latest.total : 0;
        return {
          ...prev,
          assessments,
          first,
          latest,
          reduction,
          reductionPct: first && first.total ? Math.round((reduction / first.total) * 100) : 0,
        };
      });
      if (editingId === id) { setEditingId(null); setEditingFull(null); }
      flash('🗑️ Assessment deleted');
    } catch (e) {
      setErr(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (err) return (
    <main style={{ padding: '2rem' }}>
      <div className="container-sm">
        <div className="alert alert-err">{err}</div>
      </div>
    </main>
  );

  if (!data) return (
    <main style={{ padding: '3rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem' }}>💧</div>
      <p>Loading…</p>
    </main>
  );

  const { assessments, first, latest, reduction, reductionPct } = data;
  const hasHistory = assessments.length > 0;

  if (!hasHistory) return (
    <main style={{ padding: '3rem 1.25rem', textAlign: 'center' }}>
      <div className="container-sm">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <h2>No assessments yet</h2>
        <p className="text-muted" style={{ margin: '1rem 0' }}>
          Complete your first assessment to start tracking your water-saving progress.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => nav('/assess')}>Start Assessment</button>
      </div>
    </main>
  );

  const chartData = assessments.map((a, i) => ({
    name: `#${i + 1}`,
    usage: a.total,
    perPerson: a.perPerson,
    score: a.score,
    isDemo: a.isDemo,
  }));

  return (
    <main style={{ padding: '2rem 1.25rem 4rem' }}>
      <div className="container-sm">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ marginBottom: '.25rem' }}>Your Water Journey</h1>
            <p className="text-muted">
              Household key:{' '}
              <code style={{ fontSize: '.8rem', background: 'var(--gray-100)', padding: '.1rem .35rem', borderRadius: 4 }}>
                {getHouseholdKey()}
              </code>
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => nav('/assess')}>+ New Assessment</button>
        </div>

        {feedback && (
          <div className="alert alert-ok" style={{ marginBottom: '1rem' }}>{feedback}</div>
        )}

        {assessments.length > 1 && (
          <div className="grid3" style={{ marginBottom: '1.5rem' }}>
            <div className="card center">
              <div className="text-xs" style={{ color: 'var(--gray-500)', fontWeight: 600 }}>FIRST ASSESSMENT</div>
              <div className="big-num-sm" style={{ margin: '.25rem 0' }}>{first.total}</div>
              <div className="text-muted">L/day</div>
            </div>
            <div className="card center">
              <div className="text-xs" style={{ color: 'var(--gray-500)', fontWeight: 600 }}>LATEST</div>
              <div className="big-num-sm" style={{ margin: '.25rem 0', color: reduction > 0 ? '#16a34a' : 'var(--blue)' }}>
                {latest.total}
              </div>
              <div className="text-muted">L/day</div>
            </div>
            <div className="card center">
  <div className="text-xs" style={{ color: 'var(--gray-500)', fontWeight: 600 }}>
    {reduction > 0 ? 'REDUCTION' : reduction < 0 ? 'INCREASE' : 'NO CHANGE'}
  </div>

  <div
    className="big-num-sm"
    style={{
      margin: '.25rem 0',
      color: reduction > 0 ? '#16a34a' : reduction < 0 ? '#dc2626' : 'var(--blue)'
    }}
  >
    {reduction > 0 ? '↓' : reduction < 0 ? '↑' : '→'} {Math.abs(reduction)}
  </div>

  <div className="text-muted">
    {Math.abs(reductionPct)}%
  </div>
</div>
          </div>
        )}

        {/* Chart */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Daily usage over time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit=" L" />
              <Tooltip formatter={(v, n) => [`${v} L`, n === 'usage' ? 'Total/day' : 'Per person']} />
              <Bar dataKey="usage" name="Total/day" radius={[4, 4, 0, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.isDemo ? '#f59e0b' : '#1a6fce'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-xs" style={{ color: 'var(--gray-400)', marginTop: '.5rem' }}>
            🟡 Demo assessments shown in amber
          </div>
        </div>

        {/* Assessment list — READ + UPDATE + DELETE */}
        <h3 style={{ marginBottom: '.75rem' }}>All assessments</h3>
        <div className="gap-col">
          {[...assessments].reverse().map(a => (
            <div key={a.id}>
              <div
                className="card card-sm"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}
              >
                {/* Identity */}
                <div>
                  {a.isDemo && (
                    <span className="badge badge-amber" style={{ marginRight: '.4rem' }}>DEMO</span>
                  )}
                  <span style={{ fontWeight: 600 }}>Assessment #{a.id}</span>
                  <div className="text-xs" style={{ color: 'var(--gray-400)', marginTop: '.15rem' }}>
                    {new Date(a.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>

                {/* Stats + action buttons */}
                <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--blue)' }}>{a.total} L/day</div>
                    <div className="text-xs" style={{ color: 'var(--gray-500)' }}>total</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{a.perPerson} L</div>
                    <div className="text-xs" style={{ color: 'var(--gray-500)' }}>per person</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--teal)' }}>{a.score}</div>
                    <div className="text-xs" style={{ color: 'var(--gray-500)' }}>score</div>
                  </div>

                  {/* READ: open full results page */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => nav(`/results/${a.id}`)}
                  >
                    View →
                  </button>

                  {/* UPDATE: fetch full record from backend, then show edit form */}
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--blue-light)', color: 'var(--blue)', border: '1.5px solid var(--blue-mid)' }}
                    onClick={() => handleEditClick(a.id)}
                    disabled={editLoading === a.id}
                  >
                    {editLoading === a.id ? '⏳' : editingId === a.id ? '✕ Cancel' : '✏️ Edit'}
                  </button>

                  {/* DELETE: confirm → real DELETE API → remove from DB and UI */}
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--red-light)', color: 'var(--red)', border: '1.5px solid #fca5a5' }}
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                  >
                    {deletingId === a.id ? '⏳' : '🗑️ Delete'}
                  </button>
                </div>
              </div>

              {/* Inline edit form — only rendered when this assessment's full data is loaded */}
              {editingId === a.id && editingFull && (
                <EditForm
                  assessment={editingFull}
                  onSave={handleSaved}
                  onCancel={() => { setEditingId(null); setEditingFull(null); }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={() => nav('/assess')}>+ New Assessment</button>
        </div>
      </div>
    </main>
  );
}