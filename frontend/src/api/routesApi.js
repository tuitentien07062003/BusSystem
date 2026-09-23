import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 25000,
});

export async function fetchRoutes({ page = 1, limit = 20, is_active, q } = {}) {
  const params = { page, limit };
  if (typeof is_active === 'boolean') params.is_active = is_active;
  if (q && q.trim()) params.q = q.trim();
  const res = await api.get('/routes', { params });
  return res.data;
}

export async function fetchRouteById(id) {
  const res = await api.get(`/routes/${id}`);
  return res.data;
}

export async function fetchFullRoute(id) {
  const res = await api.get(`/routes/${id}/full`, { timeout: 20000 });
  return res.data;
}

export async function fetchRouteStats() {
  const res = await api.get('/routes/stats');
  return res.data;
}

export async function updateRoute(id, payload) {
  const res = await api.put(`/routes/${id}`, payload);
  return res.data;
}

export async function changeRouteStatus(id, is_active) {
  const res = await api.patch(`/routes/${id}/status`, { is_active });
  return res.data;
}

export async function fetchDepotsForComposer() {
  const res = await api.get('/routes/composer/depots');
  return res.data.data || [];
}

export async function searchStopsForComposer({ q = '', limit = 50 } = {}) {
  const res = await api.get('/routes/composer/stops/search', {
    params: { q, limit }, timeout: 15000,
  });
  return res.data.data || [];
}

export async function previewRoute(payload) {
  const res = await api.post('/routes/composer/preview', payload, { timeout: 30000 });
  return res.data;
}

export async function saveComposedRoute(payload) {
  const res = await api.post('/routes/composer/save', payload, { timeout: 60000 });
  return res.data;
}

export async function deleteComposedRoute(id) {
  const res = await api.delete(`/routes/composer/${id}`);
  return res.data;
}

export async function matchStops(payload) {
  const res = await api.post("/routes/composer/match-stops", payload, { timeout: 20000 });
  return res.data;
}
