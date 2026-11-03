import { Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import Landing from './pages/Landing';
import Assess from './pages/Assess';
import Results from './pages/Results';
import Progress from './pages/Progress';

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/assess" element={<Assess />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
