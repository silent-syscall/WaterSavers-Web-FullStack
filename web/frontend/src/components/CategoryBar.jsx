const COLORS = { bathing:'#1a6fce', toilet:'#7c3aed', taps:'#0d9488', kitchen:'#d97706', laundry:'#db2777', garden:'#16a34a', other:'#64748b' };
export default function CategoryBar({ categories, max }) {
  const m = max || Math.max(...categories.map(c => c.litres), 1);
  return (
    <div className="gap-col" style={{gap:'.5rem'}}>
      {categories.map(c => (
        <div key={c.key} className="sim-bar-row">
          <span className="sim-bar-label">{c.icon} {c.label.split(',')[0].split('&')[0].trim()}</span>
          <div className="sim-bar-track">
            <div className="sim-bar-fill" style={{width:`${(c.litres/m)*100}%`,background:COLORS[c.key]||'#64748b'}}>{c.litres > 0 ? `${c.share}%` : ''}</div>
          </div>
          <span className="sim-bar-num">{c.litres} L</span>
        </div>
      ))}
    </div>
  );
}
