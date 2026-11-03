import { NavLink, useNavigate } from 'react-router-dom';
import { getLastId } from '../api';
export default function Nav() {
  const id = getLastId();
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="nav-logo">💧 WaterSavers</NavLink>
        <div className="nav-links">
          <NavLink to="/assess" className={({isActive})=>'nav-link'+(isActive?' active':'')}>Assess</NavLink>
          {id && <NavLink to={`/results/${id}`} className={({isActive})=>'nav-link'+(isActive?' active':'')}>Results</NavLink>}
          <NavLink to="/progress" className={({isActive})=>'nav-link'+(isActive?' active':'')}>Progress</NavLink>
        </div>
      </div>
    </nav>
  );
}
