const BASE = import.meta.env.VITE_API_URL || '/api';

const j = async (path, opts) => {
  const r = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || 'Request failed');
  return body;
};

export const api = {
  calculate: (answers) => j('/calculate', { method: 'POST', body: JSON.stringify({ answers }) }),

  createAssessment: (householdKey, answers, isDemo = false) =>
    j('/assessment', { method: 'POST', body: JSON.stringify({ householdKey, answers, isDemo }) }),

  getAssessment: (id) => j(`/assessment/${id}`),

  updateAssessment: (id, answers) =>
    j(`/assessment/${id}`, { method: 'PUT', body: JSON.stringify({ answers }) }),

  deleteAssessment: (id) =>
    j(`/assessment/${id}`, { method: 'DELETE' }),

  simulate: (assessmentId, changes, save = false) =>
    j('/simulation', { method: 'POST', body: JSON.stringify({ assessmentId, changes, save }) }),

  setGoal: (id, targetLpd) =>
    j(`/assessment/${id}/goal`, { method: 'PUT', body: JSON.stringify({ targetLpd }) }),

  setAction: (id, actionId, completed) =>
    j(`/assessment/${id}/actions/${actionId}`, { method: 'PUT', body: JSON.stringify({ completed }) }),

  getProgress: (key) => j(`/progress/${key}`),

  getDemo: () => j('/demo'),
};

export function getHouseholdKey() {
  let k = localStorage.getItem('ws_key');

  if (!k) {
    k = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    localStorage.setItem('ws_key', k);
  }

  return k;
}

export function getLastId() {
  return localStorage.getItem('ws_last_id');
}

export function setLastId(id) {
  localStorage.setItem('ws_last_id', String(id));
}