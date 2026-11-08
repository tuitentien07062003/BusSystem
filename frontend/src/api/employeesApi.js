import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLEET_API_BASE_URL || "/fleet",
  timeout: 15000,
});

// ═══════════════════════════════════════════════════════════════
// Danh sách nhân viên
// ═══════════════════════════════════════════════════════════════
export async function fetchEmployees({
  page = 1,
  limit = 20,
  type,
  is_active,
  q,
} = {}) {
  const params = { page, limit };
  if (type) params.type = type;
  if (typeof is_active === "boolean") params.is_active = is_active;
  if (q && q.trim()) params.q = q.trim();

  const res = await api.get("/employees", { params });
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// Thống kê
// ═══════════════════════════════════════════════════════════════
export async function fetchEmployeeStats() {
  const res = await api.get("/employees/stats");
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// Chi tiết
// ═══════════════════════════════════════════════════════════════
export async function fetchEmployeeById(id) {
  const res = await api.get(`/employees/${id}`);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// Tạo mới
// ═══════════════════════════════════════════════════════════════
export async function createEmployee(payload) {
  const res = await api.post("/employees", payload);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// Cập nhật
// ═══════════════════════════════════════════════════════════════
export async function updateEmployee(id, payload) {
  const res = await api.put(`/employees/${id}`, payload);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// Đổi trạng thái
// ═══════════════════════════════════════════════════════════════
export async function changeEmployeeStatus(id, is_active) {
  const res = await api.patch(`/employees/${id}/status`, { is_active });
  return res.data;
}
