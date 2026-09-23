import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

export async function fetchTrips({ page = 1, limit = 20, is_active, q } = {}) {
  const params = { page, limit };
  if (typeof is_active === 'boolean') params.is_active = is_active;
  if (q && q.trim()) params.q = q.trim();
  const res = await api.get('/trips', { params });
  return res.data;
}

export async function fetchTripsByRoute(routeId, { page = 1, limit = 20 } = {}) {
  const res = await api.get(`/trips/by-route/${routeId}`, { params: { page, limit } });
  return res.data;
}

export async function fetchTripById(id) {
  const res = await api.get(`/trips/${id}`);
  return res.data;
}

export async function createTrip(payload) {
  const res = await api.post('/trips', payload);
  return res.data;
}

export async function updateTrip(id, payload) {
  const res = await api.put(`/trips/${id}`, payload);
  return res.data;
}

export async function changeTripStatus(id, is_active) {
  const res = await api.patch(`/trips/${id}/status`, { is_active });
  return res.data;
}
