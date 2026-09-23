import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

export async function fetchAgencies({ page = 1, limit = 20, is_active, q } = {}) {
  const params = { page, limit };
  if (typeof is_active === 'boolean') params.is_active = is_active;
  if (q && q.trim()) params.q = q.trim();
  const res = await api.get('/agencies', { params });
  return res.data;
}

export async function fetchAgencyById(id) {
  const res = await api.get(`/agencies/${id}`);
  return res.data;
}

export async function fetchAgencyStats() {
  const res = await api.get('/agencies/stats');
  return res.data;
}

export async function createAgency(payload) {
  const res = await api.post('/agencies', payload);
  return res.data;
}

export async function updateAgency(id, payload) {
  const res = await api.put(`/agencies/${id}`, payload);
  return res.data;
}

export async function changeAgencyStatus(id, is_active) {
  const res = await api.patch(`/agencies/${id}/status`, { is_active });
  return res.data;
}
