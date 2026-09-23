import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

export async function fetchPatterns({ page = 1, limit = 20, route_id, direction_id, q } = {}) {
  const params = { page, limit };
  if (route_id) params.route_id = route_id;
  if (direction_id !== undefined && direction_id !== null && direction_id !== '') {
    params.direction_id = direction_id;
  }
  if (q && q.trim()) params.q = q.trim();
  const res = await api.get('/trip-patterns', { params });
  return res.data;
}

export async function fetchPatternById(id) {
  const res = await api.get(`/trip-patterns/${id}`);
  return res.data;
}

export async function fetchPatternDetail(id) {
  const res = await api.get(`/trip-patterns/${id}/detail`);
  return res.data;
}

export async function fetchPatternStats() {
  const res = await api.get('/trip-patterns/stats');
  return res.data;
}

export async function fetchPatternsByRoute(routeId) {
  const res = await api.get(`/trip-patterns/by-route/${routeId}`);
  return res.data.data || [];
}

export async function createPattern(payload) {
  const res = await api.post('/trip-patterns', payload);
  return res.data;
}

export async function updatePattern(id, payload) {
  const res = await api.put(`/trip-patterns/${id}`, payload);
  return res.data;
}

export async function deletePattern(id, { cascade = true } = {}) {
  const res = await api.delete(`/trip-patterns/${id}`, { params: { cascade } });
  return res.data;
}

// ─── Stop times của pattern ───
export async function fetchPatternStopTimes(patternId) {
  const res = await api.get(`/trip-patterns/${patternId}/stop-times`);
  return res.data.data || [];
}

export async function replacePatternStopTimes(patternId, stops) {
  const res = await api.put(`/trip-patterns/${patternId}/stop-times`, { stops });
  return res.data;
}
