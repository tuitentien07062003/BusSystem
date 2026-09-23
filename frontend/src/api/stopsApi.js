import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
});

function withStopType(params, stop_type) {
  if (stop_type !== undefined && stop_type !== null) {
    params.stop_type = stop_type;
  }
  return params;
}

export async function fetchStops({ page = 1, limit = 20, is_active, stop_type } = {}) {
  const params = withStopType({ page, limit }, stop_type);
  if (typeof is_active === 'boolean') params.is_active = is_active;
  const res = await api.get('/stops', { params });
  return res.data;
}

export async function searchStops({ q, page = 1, limit = 20, is_active, stop_type } = {}) {
  const params = withStopType({ q, page, limit }, stop_type);
  if (typeof is_active === 'boolean') params.is_active = is_active;
  const res = await api.get('/stops/search', { params, timeout: 25000 });
  return res.data;
}

export async function fetchStopById(id) {
  const res = await api.get(`/stops/${id}`);
  return res.data;
}

export async function fetchStopStats(stop_type) {
  const params = withStopType({}, stop_type);
  const res = await api.get('/stops/stats', { params });
  return res.data;
}

export async function updateStop(id, payload) {
  const res = await api.put(`/stops/${id}`, payload);
  return res.data;
}

export async function changeStopStatus(id, is_active) {
  const res = await api.patch(`/stops/${id}/status`, { is_active });
  return res.data;
}

// ── Road Override ──
export async function getNearbyRoads(stopId, radiusM = 300) {
  const res = await api.get(`/stops/${stopId}/nearby-roads`, {
    params: { radius_m: radiusM },
  });
  return res.data.data || [];
}

export async function getStopOverride(stopId) {
  const res = await api.get(`/stops/${stopId}/override`);
  return res.data.data;
}

export async function setStopOverride(stopId, roadId, note = null) {
  const res = await api.put(`/stops/${stopId}/override`, { road_id: roadId, note });
  return res.data;
}

export async function removeStopOverride(stopId) {
  const res = await api.delete(`/stops/${stopId}/override`);
  return res.data;
}
