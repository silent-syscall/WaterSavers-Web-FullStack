export default function ScoreRing({ score, size = 120 }) {
  const r = 46, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const colors = { Excellent: '#16a34a', Good: '#0d9488', 'Needs Improvement': '#d97706', Poor: '#ea580c', Critical: '#dc2626' };
  const col = colors[score.level] || '#1a6fce';
  return (
    <div className="score-wrap">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8"/>
        <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{transition:'stroke-dasharray .5s ease'}}/>
        <text x="50" y="44" textAnchor="middle" fontSize="20" fontWeight="800" fill={col}>{score.points}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="9" fill="#64748b">{score.level}</text>
      </svg>
    </div>
  );
}
