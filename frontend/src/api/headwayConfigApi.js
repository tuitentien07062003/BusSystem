import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
});

// ═══════════════════════════════════════════════════════════════
// Lấy configs hiện tại của tuyến
// ═══════════════════════════════════════════════════════════════
export async function fetchHeadwayConfigs(routeId) {
  const res = await api.get(`/routes/${routeId}/headway-configs`);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// Bulk replace toàn bộ configs
// @param {Array} configs - [{ from_time, to_time, headway_seconds, label? }]
// ═══════════════════════════════════════════════════════════════
export async function replaceHeadwayConfigs(routeId, configs) {
  const res = await api.put(`/routes/${routeId}/headway-configs`, {
    configs,
  });
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// Xóa toàn bộ configs
// ═══════════════════════════════════════════════════════════════
export async function clearHeadwayConfigs(routeId) {
  const res = await api.delete(`/routes/${routeId}/headway-configs`);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// Lấy preset theo loại tuyến
// @param {string} category - 'urban' | 'airport'
// ═══════════════════════════════════════════════════════════════
export async function fetchPresetConfigs(category = "urban") {
  const res = await api.get(`/routes/0/headway-configs/preset`, {
    params: { category },
  });
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// Validate configs (không lưu)
// ═══════════════════════════════════════════════════════════════
export async function validateHeadwayConfigs(routeId, payload) {
  const res = await api.post(
    `/routes/${routeId}/headway-configs/validate`,
    payload,
  );
  return res.data;
}
