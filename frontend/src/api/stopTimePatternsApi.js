import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

export async function fetchStopTimes({ page = 1, limit = 50, trip_pattern_id, stop_id } = {}) {
  const params = { page, limit };
  if (trip_pattern_id) params.trip_pattern_id = trip_pattern_id;
  if (stop_id) params.stop_id = stop_id;
  const res = await api.get('/stop-time-patterns', { params });
  return res.data;
}

export async function fetchStopTimeStats() {
  const res = await api.get('/stop-time-patterns/stats');
  return res.data;
}

export async function fetchStopTimeById(id) {
  const res = await api.get(`/stop-time-patterns/${id}`);
  return res.data;
}

export async function createStopTime(payload) {
  const res = await api.post('/stop-time-patterns', payload);
  return res.data;
}

export async function updateStopTime(id, payload) {
  const res = await api.put(`/stop-time-patterns/${id}`, payload);
  return res.data;
}

export async function deleteStopTime(id) {
  const res = await api.delete(`/stop-time-patterns/${id}`);
  return res.data;
}
