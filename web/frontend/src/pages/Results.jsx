import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import ScoreRing from '../components/Scoring';
import CategoryBar from '../components/CategoryBar';

const SCORE_COLORS = { Excellent:'#16a34a', Good:'#0d9488', 'Needs Improvement':'#d97706', Poor:'#ea580c', Critical:'#dc2626' };
const STATUS_BADGE = { 'WITHIN REFERENCE':'badge-green', 'SLIGHTLY HIGH':'badge-amber', HIGH:'badge-red' };

function Section({ title, children }) {
  return <div style={{marginTop:'1.5rem'}}><h3 style={{fontSize:'1.05rem',marginBottom:'.75rem',color:'var(--gray-700)'}}>{title}</h3>{children}</div>;
}

/* ── Simulator ── */
function Simulator({ data, assessmentId }) {
  const a = data.answers;
  const [sim, setSim] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!data.savedSimulation);
  const [controls, setControls] = useState({
    showerMinutes: a.showerMinutes,
    brushTapRunning: a.brushTapRunning,
    kitchenTapRunning: a.kitchenTapRunning,
    gardenDaysPerWeek: a.gardenDaysPerWeek,
    loadsPerWeek: a.loadsPerWeek,
  });

  const runSim = useCallback(async (c, save = false) => {
    try {
      const r = await api.simulate(assessmentId, c, save);
      setSim(r);
      if (save) setSaved(true);
    } catch {}
  }, [assessmentId]);

  useEffect(() => { runSim(controls); }, [controls, runSim]);

  const set = (k, v) => setControls(p => ({ ...p, [k]: v }));

  const current = sim ? sim.current : data.total;
  const after = sim ? sim.after : data.total;
  const dailySaving = sim ? sim.saving.daily : 0;
  const yearSaving = sim ? sim.saving.yearly : 0;
  const maxBar = current;

  return (
    <div className="card" style={{borderTop:'4px solid #1a6fce',marginTop:'1.5rem'}}>
      <div className="wow-header">💧 What if I changed just 3 habits?</div>
      <p className="text-muted" style={{textAlign:'center',marginBottom:'1.5rem',fontSize:'.9rem'}}>Adjust the sliders to see your potential savings instantly.</p>

      <div className="sim-panel">
        <div>
          <h4 style={{marginBottom:'.75rem',fontSize:'.925rem',color:'var(--gray-600)'}}>🎛️ Adjust your habits</h4>
          <div className="gap-col">
            {a.bathMethod === 'shower' && (
              <div className="range-row">
                <div className="range-label">
                  <span className="label">🚿 Shower duration</span>
                  <span className="range-value">{controls.showerMinutes} <span style={{fontSize:'.75rem',fontWeight:400}}>min</span></span>
                </div>
                <input type="range" min={1} max={30} value={controls.showerMinutes} onChange={e => set('showerMinutes', Number(e.target.value))} />
              </div>
            )}
            <div className="toggle-row">
              <span className="label">🪥 Tap off while brushing?</span>
              <label className="toggle">
                <input type="checkbox" checked={!controls.brushTapRunning} onChange={e => set('brushTapRunning', !e.target.checked)} />
                <span className="toggle-track" />
              </label>
            </div>
            <div className="toggle-row">
              <span className="label">🍳 Kitchen tap managed?</span>
              <label className="toggle">
                <input type="checkbox" checked={!controls.kitchenTapRunning} onChange={e => set('kitchenTapRunning', !e.target.checked)} />
                <span className="toggle-track" />
              </label>
            </div>
            {a.hasGarden && (
              <div className="range-row">
                <div className="range-label">
                  <span className="label">🌱 Garden watering days</span>
                  <span className="range-value">{controls.gardenDaysPerWeek} <span style={{fontSize:'.75rem',fontWeight:400}}>days/week</span></span>
                </div>
                <input type="range" min={0} max={7} value={controls.gardenDaysPerWeek} onChange={e => set('gardenDaysPerWeek', Number(e.target.value))} />
              </div>
            )}
            <div className="range-row">
              <div className="range-label">
                <span className="label">🧺 Laundry loads</span>
                <span className="range-value">{controls.loadsPerWeek} <span style={{fontSize:'.75rem',fontWeight:400}}>loads/week</span></span>
              </div>
              <input type="range" min={0} max={20} value={controls.loadsPerWeek} onChange={e => set('loadsPerWeek', Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div>
          <h4 style={{marginBottom:'.75rem',fontSize:'.925rem',color:'var(--gray-600)'}}>📊 Impact</h4>
          <div className="sim-bar-wrap">
            <div className="sim-bar-row">
              <span className="sim-bar-label" style={{fontSize:'.78rem'}}>Current</span>
              <div className="sim-bar-track">
                <div className="sim-bar-fill" style={{width:'100%',background:'#1a6fce'}}>{current} L</div>
              </div>
            </div>
            <div className="sim-bar-row">
              <span className="sim-bar-label" style={{fontSize:'.78rem'}}>After</span>
              <div className="sim-bar-track">
                <div className="sim-bar-fill" style={{width:`${maxBar ? (after/maxBar)*100 : 0}%`,background:'#0d9488'}}>{after} L</div>
              </div>
            </div>
          </div>

          <div style={{background: dailySaving > 0 ? '#dcfce7' : '#f1f5f9', borderRadius:10, padding:'1rem', textAlign:'center'}}>
            {dailySaving > 0 ? <>
              <div style={{fontSize:'1.6rem',fontWeight:800,color:'#16a34a'}}>↓ {dailySaving} L/day</div>
              <div style={{fontSize:'.95rem',fontWeight:600,color:'#15803d'}}>{yearSaving.toLocaleString()} L/year</div>
              <hr style={{margin:'.5rem 0',border:'none',borderTop:'1px solid #bbf7d0'}} />
              {sim && Object.entries(sim.comparisons).slice(0,2).map(([k,c]) => (
                <div key={k} style={{fontSize:'.8rem',color:'#166534'}}>≈ {c.count.toLocaleString()} {c.label}</div>
              ))}
            </> : <div style={{color:'var(--gray-500)',fontSize:'.9rem'}}>Adjust the controls to simulate savings</div>}
          </div>

          {dailySaving > 0 && !saved && (
            <button className="btn btn-teal" style={{width:'100%',marginTop:'.75rem'}} disabled={saving}
              onClick={async () => { setSaving(true); await runSim(controls, true); setSaving(false); }}>
              {saving ? '⏳ Saving…' : '💾 Save this simulation'}
            </button>
          )}
          {saved && <div className="alert alert-ok" style={{marginTop:'.5rem'}}>✓ Simulation saved</div>}
        </div>
      </div>
    </div>
  );
}

/* ── Goal ── */
function Goal({ data, assessmentId }) {
  const [goal, setGoalVal] = useState(data.goal);
  const [saving, setSaving] = useState(false);
  const OPTS = [10, 20, 30, 50];
  const potential = data.top3Saving ? data.top3Saving.daily : 0;

  async function save(t) {
    setSaving(true);
    try { await api.setGoal(assessmentId, t); setGoalVal(t); } catch {}
    setSaving(false);
  }

  return (
    <div className="card card-sm" style={{marginTop:'1rem'}}>
      <h4 style={{marginBottom:'.75rem'}}>🎯 Water-saving goal</h4>
      <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
        {OPTS.map(t => (
          <button key={t} className={'btn btn-sm ' + (goal === t ? 'btn-primary' : 'btn-secondary')} onClick={() => save(t)} disabled={saving}>
            {t} L/day
          </button>
        ))}
      </div>
      {goal && <>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'.85rem',marginBottom:'.3rem'}}>
          <span>Potential saving (top 3 changes)</span><span>{potential} / {goal} L/day</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{width:`${Math.min(100,(potential/goal)*100)}%`,background:'#0d9488'}} />
        </div>
        <div className="text-xs" style={{marginTop:'.3rem',color:'var(--gray-500)'}}>{Math.min(100,Math.round((potential/goal)*100))}% of goal achievable with top 3 habit changes</div>
      </>}
    </div>
  );
}

/* ── 7-day plan ── */
function Plan({ plan, assessmentId, actions: initActions }) {
  const [actions, setActions] = useState(initActions || {});
  async function toggle(id, done) {
    try { await api.setAction(assessmentId, id, done); setActions(p => ({ ...p, [id]: done })); } catch {}
  }
  return (
    <div className="gap-col" style={{gap:'.5rem'}}>
      {plan.map(p => (
        <div key={p.day} className="card card-sm" style={{display:'flex',gap:'.75rem',alignItems:'flex-start',opacity:actions[p.id] ? .55 : 1}}>
          <div style={{minWidth:32,height:32,borderRadius:'50%',background:'var(--blue-light)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'var(--blue)',fontSize:'.8rem',flexShrink:0}}>D{p.day}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:'.9rem'}}>{p.icon} {p.title}</div>
            <div className="text-xs" style={{color:'var(--gray-500)',marginTop:'.15rem'}}>{p.action}</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={!!actions[p.id]} onChange={e => toggle(p.id, e.target.checked)} />
            <span className="toggle-track" />
          </label>
        </div>
      ))}
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.getAssessment(id).then(setData).catch(e => setErr(e.message));
  }, [id]);

  if (err) return <main style={{padding:'2rem'}}><div className="container-sm"><div className="alert alert-err">{err}</div><button className="btn btn-secondary mt-1" onClick={() => nav('/assess')}>← New assessment</button></div></main>;
  if (!data) return <main style={{padding:'3rem',textAlign:'center'}}><div style={{fontSize:'2rem',marginBottom:'1rem'}}>💧</div><p>Loading your results…</p></main>;

  const scoreCol = SCORE_COLORS[data.score.level] || '#1a6fce';
  const bmBadge = STATUS_BADGE[data.benchmark.status] || 'badge-gray';

  return (
    <main style={{padding:'2rem 1.25rem 4rem'}}>
      <div className="container">
        {data.isDemo && <div className="demo-banner">⚡ DEMO HOUSEHOLD — These are example figures, not real measurements</div>}

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'1rem',marginBottom:'1.5rem'}}>
          <div>
            <h1 style={{fontSize:'1.75rem'}}>Your Water Profile</h1>
            <p className="text-muted">Estimated household water usage</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => nav('/assess')}>+ New Assessment</button>
        </div>

        {/* Key numbers */}
        <div className="grid3">
          <div className="card center">
            <div style={{fontSize:'.78rem',color:'var(--gray-500)',fontWeight:600,marginBottom:'.35rem'}}>EST. DAILY USAGE</div>
            <div className="big-num">{data.total}</div>
            <div className="text-muted">L/household/day</div>
            <div style={{marginTop:'.25rem',fontWeight:600,fontSize:'.9rem',color:'var(--gray-700)'}}>{data.perPerson} L/person</div>
          </div>
          <div className="card center">
            <div style={{fontSize:'.78rem',color:'var(--gray-500)',fontWeight:600,marginBottom:'.35rem'}}>CONSERVATION SCORE</div>
            <ScoreRing score={data.score} size={100} />
          </div>
          <div className="card center">
            <div style={{fontSize:'.78rem',color:'var(--gray-500)',fontWeight:600,marginBottom:'.35rem'}}>VS REFERENCE</div>
            <div className="big-num-sm">{data.benchmark.value}</div>
            <div className="text-muted">L/person/day</div>
            <span className={`badge ${bmBadge}`} style={{marginTop:'.4rem'}}>{data.benchmark.status}</span>
            <div className="text-xs" style={{marginTop:'.35rem',color:'var(--gray-500)'}}>CPHEEO urban planning norm</div>
          </div>
        </div>

        <div className="grid2" style={{marginTop:'1.5rem',gap:'1.5rem'}}>
          {/* Left column */}
          <div>
            <div className="card">
              <h3 style={{marginBottom:'.75rem',fontSize:'1.05rem'}}>Category breakdown</h3>
              <CategoryBar categories={data.categories} />
            </div>

            <div className="card" style={{marginTop:'1rem',borderLeft:`4px solid ${scoreCol}`}}>
              <h3 style={{marginBottom:'.5rem'}}>Score breakdown</h3>
              <div style={{fontSize:'2rem',fontWeight:800,color:scoreCol}}>{data.score.points}<span style={{fontSize:'1rem',fontWeight:400,color:'var(--gray-500)'}}> / 100</span></div>
              {data.score.strengths.length > 0 && <>
                <div style={{fontWeight:600,fontSize:'.82rem',color:'var(--green)',marginTop:'.75rem',marginBottom:'.25rem'}}>✓ What you're doing well</div>
                {data.score.strengths.map(s => <div key={s} className="text-sm" style={{color:'var(--gray-700)',paddingLeft:'.75rem'}}>• {s}</div>)}
              </>}
              {data.score.improvements.length > 0 && <>
                <div style={{fontWeight:600,fontSize:'.82rem',color:'var(--amber)',marginTop:'.75rem',marginBottom:'.25rem'}}>→ Areas to improve</div>
                {data.score.improvements.map(s => <div key={s} className="text-sm" style={{color:'var(--gray-700)',paddingLeft:'.75rem'}}>• {s}</div>)}
              </>}
            </div>

            <div className="card" style={{marginTop:'1rem',background:'var(--amber-light)',border:'1.5px solid #f59e0b'}}>
              <div style={{fontSize:'.78rem',fontWeight:700,color:'#92400e',marginBottom:'.25rem'}}>BIGGEST WATER USER</div>
              <div style={{fontSize:'1.25rem',fontWeight:800}}>{data.biggest.icon} {data.biggest.label}</div>
              <div className="text-muted">{data.biggest.litres} L/day · {data.biggest.share}% of total</div>
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className="card">
              <h3 style={{marginBottom:'1rem'}}>Top 3 highest-impact changes</h3>
              {data.top3.map((r, i) => (
                <div key={r.id} style={{borderBottom: i < data.top3.length-1 ? '1px solid var(--gray-200)' : 'none', paddingBottom:'1rem', marginBottom:'1rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'.5rem'}}>
                    <div>
                      <div style={{fontWeight:700}}>{r.icon} {r.title}</div>
                      <div className="text-sm" style={{color:'var(--gray-500)',marginTop:'.15rem'}}>{r.problem}</div>
                      <div className="text-sm" style={{marginTop:'.15rem'}}>{r.action}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontWeight:800,color:'#16a34a',fontSize:'1.05rem'}}>{r.saving.daily} L/day</div>
                      <span className={`badge ${r.impact === 'High' ? 'badge-green' : r.impact === 'Medium' ? 'badge-amber' : 'badge-gray'}`}>{r.impact}</span>
                    </div>
                  </div>
                </div>
              ))}
              {data.top3Saving.daily > 0 && (
                <div style={{background:'var(--blue-light)',borderRadius:8,padding:'.75rem',textAlign:'center',marginTop:'.5rem'}}>
                  <div style={{fontWeight:800,color:'var(--blue)',fontSize:'1.1rem'}}>Combined: {data.top3Saving.daily} L/day</div>
                  <div className="text-sm" style={{color:'var(--blue-dark)'}}>{data.top3Saving.yearly.toLocaleString()} L/year</div>
                </div>
              )}
            </div>

            <Goal data={data} assessmentId={id} />
          </div>
        </div>

        {/* Simulator */}
        <Simulator data={data} assessmentId={id} />

        {/* Transparency */}
        <div className="card" style={{marginTop:'1.5rem'}}>
          <h3 style={{marginBottom:'1rem'}}>🔍 How was this estimated?</h3>
          <div className="grid2" style={{gap:'.75rem'}}>
            {data.categories.map(c => (
              <div key={c.key} style={{background:'var(--gray-50)',borderRadius:8,padding:'.6rem .8rem'}}>
                <div style={{fontWeight:600,fontSize:'.875rem',marginBottom:'.2rem'}}>{c.icon} {c.label}</div>
                <div className="text-xs" style={{color:'var(--gray-500)',lineHeight:1.5,fontFamily:'monospace'}}>{c.formula}</div>
              </div>
            ))}
          </div>
          <div className="alert" style={{background:'var(--blue-light)',border:'1px solid var(--blue-mid)',marginTop:'.75rem',fontSize:'.82rem'}}>
            All results are <strong>estimated</strong> from your answers and documented reference flow-rate constants. Not actual measured consumption. See the reference data in the backend for sources.
          </div>
        </div>

        {/* 7-day plan */}
        <div style={{marginTop:'1.5rem'}}>
          <h3 style={{marginBottom:'1rem'}}>📅 Your 7-day water-saving plan</h3>
          <Plan plan={data.plan} assessmentId={id} actions={data.actions} />
        </div>
      </div>
    </main>
  );
}
