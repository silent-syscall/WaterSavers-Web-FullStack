import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getHouseholdKey, setLastId } from '../api';

const DEFAULTS = {
  people: 4, bathMethod: 'shower', showerMinutes: 8, showersPerPerson: 1, bucketsPerBath: 2, lowFlowShower: false,
  brushTapRunning: true, kitchenTapRunning: true, dishMethod: 'tap_running',
  toiletType: 'standard', flushesPerPerson: 5,
  loadsPerWeek: 4, fullLoads: true, washerType: 'top_loading',
  hasGarden: false, gardenDaysPerWeek: 3, gardenMinutes: 15, gardenMethod: 'hose',
  hasRO: false, roRejectReused: false, greywaterReused: false, rainwater: false, plantsReuse: false,
};

const STEPS = [
  { id: 'household', title: 'Household', icon: '🏠' },
  { id: 'bathing',   title: 'Bathing',   icon: '🚿' },
  { id: 'bathroom',  title: 'Bathroom & Kitchen', icon: '🚰' },
  { id: 'toilet',    title: 'Toilet',    icon: '🚽' },
  { id: 'laundry',   title: 'Laundry',   icon: '🧺' },
  { id: 'garden',    title: 'Garden',    icon: '🌱' },
  { id: 'reuse',     title: 'Water Reuse', icon: '♻️' },
];

function Toggle({ label, checked, onChange, hint }) {
  return (
    <div className="toggle-row">
      <div>
        <div className="label">{label}</div>
        {hint && <div className="text-xs" style={{color:'var(--gray-500)'}}>{hint}</div>}
      </div>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-track" />
      </label>
    </div>
  );
}

function Range({ label, value, min, max, step = 1, unit, onChange }) {
  return (
    <div className="range-row">
      <div className="range-label">
        <span className="label">{label}</span>
        <span className="range-value">{value} <span style={{fontSize:'.75rem',fontWeight:400,color:'var(--gray-500)'}}>{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'.72rem',color:'var(--gray-400)'}}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function Seg({ label, value, options, onChange }) {
  return (
    <div className="field">
      <div className="label">{label}</div>
      <div className="segmented">
        {options.map(o => (
          <button key={o.value} className={'seg-btn' + (value === o.value ? ' active' : '')} onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

export default function Assess() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState({ ...DEFAULTS });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const set = (k, v) => setA(prev => ({ ...prev, [k]: v }));
  const total = STEPS.length;

  async function submit() {
    setLoading(true); setErr('');
    try {
      const r = await api.createAssessment(getHouseholdKey(), a, false);
      setLastId(r.id); nav(`/results/${r.id}`);
    } catch(e) { setErr(e.message); setLoading(false); }
  }

  const stepContent = [
    // 0 Household
    <div className="gap-col" key="h">
      <Range label="Number of people in household" value={a.people} min={1} max={12} unit="people" onChange={v => set('people', v)} />
    </div>,
    // 1 Bathing
    <div className="gap-col" key="b">
      <Seg label="Bathing method" value={a.bathMethod}
        options={[{value:'shower',label:'🚿 Shower'},{value:'bucket',label:'🪣 Bucket'}]}
        onChange={v => set('bathMethod', v)} />
      {a.bathMethod === 'shower' ? <>
        <Range label="Average shower duration" value={a.showerMinutes} min={1} max={45} unit="min" onChange={v => set('showerMinutes', v)} />
        <Range label="Showers per person per day" value={a.showersPerPerson} min={0} max={4} unit="showers" onChange={v => set('showersPerPerson', v)} />
        <Toggle label="Low-flow showerhead fitted?" checked={a.lowFlowShower} onChange={v => set('lowFlowShower', v)} hint="~7.6 L/min vs ~9.5 L/min for standard" />
      </> : <>
        <Range label="Buckets of water per bath" value={a.bucketsPerBath} min={1} max={6} unit="buckets" onChange={v => set('bucketsPerBath', v)} />
        <Range label="Baths per person per day" value={a.showersPerPerson} min={0} max={4} unit="baths" onChange={v => set('showersPerPerson', v)} />
      </>}
    </div>,
    // 2 Bathroom & Kitchen
    <div className="gap-col" key="bk">
      <Toggle label="Tap left running while brushing teeth?" checked={a.brushTapRunning} onChange={v => set('brushTapRunning', v)} hint="Leaving it on uses ~6 L/min" />
      <Toggle label="Kitchen tap often left running?" checked={a.kitchenTapRunning} onChange={v => set('kitchenTapRunning', v)} />
      <Seg label="How do you wash dishes?" value={a.dishMethod}
        options={[{value:'tap_running',label:'Running tap'},{value:'basin',label:'Basin'},{value:'dishwasher',label:'Dishwasher'}]}
        onChange={v => set('dishMethod', v)} />
    </div>,
    // 3 Toilet
    <div className="gap-col" key="t">
      <Seg label="Toilet flush type" value={a.toiletType}
        options={[{value:'standard',label:'Standard (~9 L)'},{value:'dual_flush',label:'Dual flush (~4.5 L)'},{value:'low_flow',label:'Low-flow (~4.8 L)'}]}
        onChange={v => set('toiletType', v)} />
      <Range label="Flushes per person per day" value={a.flushesPerPerson} min={1} max={12} unit="flushes" onChange={v => set('flushesPerPerson', v)} />
    </div>,
    // 4 Laundry
    <div className="gap-col" key="l">
      <Range label="Washing-machine loads per week" value={a.loadsPerWeek} min={0} max={20} unit="loads" onChange={v => set('loadsPerWeek', v)} />
      <Toggle label="Usually run full loads?" checked={a.fullLoads} onChange={v => set('fullLoads', v)} hint="Partial loads waste water and energy" />
      <Seg label="Washing machine type" value={a.washerType}
        options={[{value:'top_loading',label:'Top-loading (~100 L)'},{value:'front_loading',label:'Front-loading (~50 L)'}]}
        onChange={v => set('washerType', v)} />
    </div>,
    // 5 Garden
    <div className="gap-col" key="g">
      <Toggle label="Do you have a garden or lawn?" checked={a.hasGarden} onChange={v => set('hasGarden', v)} />
      {a.hasGarden && <>
        <Range label="Watering days per week" value={a.gardenDaysPerWeek} min={0} max={7} unit="days" onChange={v => set('gardenDaysPerWeek', v)} />
        <Range label="Minutes of watering per session" value={a.gardenMinutes} min={5} max={120} step={5} unit="min" onChange={v => set('gardenMinutes', v)} />
        <Seg label="Watering method" value={a.gardenMethod}
          options={[{value:'hose',label:'🏚️ Hose (~12 L/min)'},{value:'can',label:'🪣 Can (~6 L/min)'},{value:'drip',label:'💧 Drip (~4 L/min)'}]}
          onChange={v => set('gardenMethod', v)} />
      </>}
    </div>,
    // 6 Reuse
    <div className="gap-col" key="r">
      <Toggle label="Do you have an RO water purifier?" checked={a.hasRO} onChange={v => set('hasRO', v)} />
      {a.hasRO && <Toggle label="RO reject water reused (cleaning/mopping)?" checked={a.roRejectReused} onChange={v => set('roRejectReused', v)} hint="RO purifiers produce ~2 L reject per 1 L purified" />}
      <Toggle label="Greywater reused (bath/kitchen water for cleaning)?" checked={a.greywaterReused} onChange={v => set('greywaterReused', v)} />
      <Toggle label="Rainwater harvesting?" checked={a.rainwater} onChange={v => set('rainwater', v)} />
      <Toggle label="Water reused for plants?" checked={a.plantsReuse} onChange={v => set('plantsReuse', v)} />
    </div>,
  ];

  const pct = Math.round(((step + 1) / total) * 100);

  return (
    <main style={{padding:'2rem 1.25rem',minHeight:'80vh'}}>
      <div className="container-sm">
        <div className="step-header">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h1 style={{fontSize:'1.4rem'}}>{STEPS[step].icon} {STEPS[step].title}</h1>
            <span className="badge badge-blue">Step {step+1} of {total}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{width:`${pct}%`,background:'var(--blue)'}} />
          </div>
          <div style={{display:'flex',gap:'.35rem',flexWrap:'wrap'}}>
            {STEPS.map((s,i) => (
              <button key={s.id} className={'seg-btn' + (i === step ? ' active' : '')} style={{flex:'unset',padding:'.25rem .5rem',fontSize:'.75rem'}}
                onClick={() => setStep(i)}>{s.icon} {s.title}</button>
            ))}
          </div>
        </div>

        <div className="card" style={{marginBottom:'1.5rem'}}>
          {stepContent[step]}
        </div>

        {err && <div className="alert alert-err">{err}</div>}

        <div style={{display:'flex',justifyContent:'space-between',gap:'1rem'}}>
          <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} disabled={step === 0}>← Back</button>
          {step < total - 1
            ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>
            : <button className="btn btn-primary btn-lg" onClick={submit} disabled={loading}>
                {loading ? '⏳ Calculating…' : '💧 Calculate My Usage'}
              </button>
          }
        </div>
      </div>
    </main>
  );
}
