import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 30000,
});

// ═══════════════════════════════════════════════════════════════
// ACTIVATE / DEACTIVATE
// ═══════════════════════════════════════════════════════════════

/**
 * Kích hoạt tuyến
 * @param {number} routeId
 * @param {Object} payload
 */
export async function activateRoute(routeId, payload = {}) {
  const res = await api.post(`/routes/${routeId}/activate`, payload);
  return res.data;
}

/**
 * Hủy kích hoạt tuyến
 */
export async function deactivateRoute(routeId) {
  const res = await api.delete(`/routes/${routeId}/operations`);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// GET / UPDATE OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Lấy metadata vận hành + stats cache
 */
export async function getRouteOperations(routeId) {
  const res = await api.get(`/routes/${routeId}/operations`);
  return res.data;
}

/**
 * Cập nhật metadata vận hành
 */
export async function updateRouteOperations(routeId, payload = {}) {
  const res = await api.put(`/routes/${routeId}/operations`, payload);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════

/**
 * Lấy số liệu theo ngày (số chuyến, giãn cách)
 */
export async function getRouteStatsByDate(routeId, date) {
  const res = await api.get(`/routes/${routeId}/stats`, {
    params: { date },
  });
  return res.data;
}

/**
 * Tính lại số liệu tĩnh (độ dài, travel time)
 */
export async function recomputeRouteStats(routeId) {
  const res = await api.post(`/routes/${routeId}/recompute-stats`);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// TRIP GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Xem trước danh sách trips sẽ sinh (không insert)
 */
export async function previewTrips(routeId, payload) {
  const res = await api.post(`/routes/${routeId}/trips/preview`, payload);
  return res.data;
}

/**
 * Sinh + insert trips vào DB
 */
export async function generateTrips(routeId, payload) {
  const res = await api.post(`/routes/${routeId}/generate-trips`, payload, {
    timeout: 60000, // có thể mất 5-10s cho nhiều trips
  });
  return res.data;
}

/**
 * Sinh lại trips (với mode khác)
 */
export async function regenerateTrips(routeId, payload) {
  const res = await api.post(`/routes/${routeId}/regenerate-trips`, payload, {
    timeout: 60000,
  });
  return res.data;
}
