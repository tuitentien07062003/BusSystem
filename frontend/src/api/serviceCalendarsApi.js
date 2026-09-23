import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

export async function fetchCalendars({ page = 1, limit = 20, q } = {}) {
  const params = { page, limit };
  if (q && q.trim()) params.q = q.trim();
  const res = await api.get('/service-calendars', { params });
  return res.data;
}

export async function fetchCalendarById(id) {
  const res = await api.get(`/service-calendars/${id}`);
  return res.data;
}

export async function createCalendar(payload) {
  const res = await api.post('/service-calendars', payload);
  return res.data;
}

export async function updateCalendar(id, payload) {
  const res = await api.put(`/service-calendars/${id}`, payload);
  return res.data;
}

export async function deleteCalendar(id) {
  const res = await api.delete(`/service-calendars/${id}`);
  return res.data;
}
