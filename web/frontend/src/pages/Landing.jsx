import { useNavigate } from 'react-router-dom';
import { api, getHouseholdKey, setLastId } from '../api';
import { useState } from 'react';
export default function Landing() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  async function startDemo() {
    setLoading(true); setErr('');
    try {
      const demo = await api.getDemo();
      const r = await api.createAssessment(getHouseholdKey(), demo.answers, true);
      setLastId(r.id); nav(`/results/${r.id}`);
    } catch(e) { setErr(e.message); setLoading(false); }
  }
  return (
    <main>
      <section style={{background:'linear-gradient(135deg,#1e3a5f 0%,#1a6fce 60%,#0d9488 100%)',color:'#fff',padding:'5rem 1.25rem 4rem',textAlign:'center'}}>
        <div className="container-sm">
          <div style={{fontSize:'3.5rem',marginBottom:'1rem'}}>💧</div>
          <h1 style={{fontSize:'clamp(1.75rem,5vw,3rem)',fontWeight:800,color:'#fff',marginBottom:'1rem'}}>
            How much water does your household really use?
          </h1>
          <p style={{fontSize:'1.15rem',opacity:.88,maxWidth:'600px',margin:'0 auto 2rem'}}>
            Measure your estimated usage. Find where it is being wasted. See exactly how much you could save.
          </p>
          <div style={{display:'flex',gap:'.75rem',justifyContent:'center',flexWrap:'wrap'}}>
            <button className="btn btn-lg" style={{background:'#fff',color:'#1a6fce',fontWeight:700}} onClick={()=>nav('/assess')}>
              📋 Start Assessment
            </button>
            <button className="btn btn-lg" style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'1.5px solid rgba(255,255,255,.4)'}} onClick={startDemo} disabled={loading}>
              {loading ? '⏳ Loading…' : '⚡ Demo Household'}
            </button>
          </div>
          {err && <div className="alert alert-err" style={{marginTop:'1rem',maxWidth:400,marginInline:'auto'}}>{err}</div>}
        </div>
      </section>

      <section style={{padding:'3.5rem 1.25rem',background:'#fff'}}>
        <div className="container">
          <h2 style={{textAlign:'center',marginBottom:'2.25rem',fontSize:'1.5rem'}}>How it works</h2>
          <div className="hiw-row">
            {[
              { icon:'📋', line1:'Answer',     line2:'7 questions'    },
              { icon:'⚙️',  line1:'Calculate', line2:'your usage'     },
              { icon:'💧', line1:'See your',   line2:'Water Profile'  },
              { icon:'🎛️', line1:'Simulate',   line2:'habit changes'  },
              { icon:'📈', line1:'Track',      line2:'your progress'  },
            ].map((s, i, a) => (
              <div key={i} className="hiw-step">
                <div className="hiw-card">
                  <span className="hiw-icon">{s.icon}</span>
                  <span className="hiw-text">{s.line1}<br/>{s.line2}</span>
                </div>
                {i < a.length - 1 && <span className="hiw-arrow">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{padding:'3.5rem 1.25rem',background:'var(--gray-50)'}}>
        <div className="container-sm">
          <h2 style={{textAlign:'center',marginBottom:'.5rem',fontSize:'1.4rem'}}>The centrepiece: Water Savings Simulator</h2>
          <p className="text-muted" style={{textAlign:'center',marginBottom:'2rem'}}>Change 3 habits. See your savings instantly.</p>
          <div className="card" style={{maxWidth:500,marginInline:'auto',borderTop:'4px solid #1a6fce'}}>
            <div className="grid2" style={{gap:'1.5rem',marginBottom:'1rem'}}>
              <div style={{textAlign:'center'}}><div style={{fontSize:'.8rem',color:'#64748b',fontWeight:600}}>CURRENT</div><div className="big-num">185</div><span className="unit-tag">L/day</span></div>
              <div style={{textAlign:'center'}}><div style={{fontSize:'.8rem',color:'#0d9488',fontWeight:600}}>AFTER CHANGES</div><div className="big-num" style={{color:'#0d9488'}}>143</div><span className="unit-tag">L/day</span></div>
            </div>
            <div style={{background:'#dcfce7',borderRadius:10,padding:'.75rem 1rem',textAlign:'center'}}>
              <strong>42 L/day saved · 15,330 L/year</strong><br/>
              <span style={{fontSize:'.82rem',color:'#16a34a'}}>≈ 102 full 150-litre bathtubs per year</span>
            </div>
            <p style={{textAlign:'center',marginTop:'1rem'}}><em style={{fontSize:'.85rem',color:'var(--gray-500)'}}>Preview only — your simulator uses your own assessment data.</em></p>
          </div>
        </div>
      </section>

      <section style={{background:'#1e3a5f',color:'#fff',padding:'3rem 1.25rem',textAlign:'center'}}>
        <div className="container-sm">
          <div style={{fontSize:'2rem',marginBottom:'.5rem'}}>🌍</div>
          <h3 style={{color:'#fff',fontSize:'1.25rem',marginBottom:'.5rem'}}>Supporting UN SDG 6: Clean Water and Sanitation</h3>
          <p style={{opacity:.8,maxWidth:550,margin:'0 auto .75rem',fontSize:'.9rem'}}>SDG 6 aims to ensure availability and sustainable management of water for all. Every household contribution matters.</p>
          <div style={{display:'flex',gap:'.5rem',justifyContent:'center',fontSize:'.875rem',opacity:.85,flexWrap:'wrap'}}>
            {['Measure','Understand','Reduce','Track'].map((s,i,a)=><span key={i}>{s}{i<a.length-1?' → ':''}</span>)}
          </div>
        </div>
      </section>
      <footer style={{textAlign:'center',padding:'1.5rem',fontSize:'.82rem',color:'var(--gray-400)'}}>
        WaterSavers · All results are estimated from household behaviour and documented reference constants, not actual measured consumption.
      </footer>
    </main>
  );
}