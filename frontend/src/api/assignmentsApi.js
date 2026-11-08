import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLEET_API_BASE_URL || "/fleet",
  timeout: 20000,
});

export async function fetchAssignments({
  date,
  from,
  to,
  employee_id,
  vehicle_id,
  route_id,
  shift_template_id,
  depot_id,
  status,
  page = 1,
  limit = 200,
} = {}) {
  const params = { page, limit };
  if (date) params.date = date;
  if (from) params.from = from;
  if (to) params.to = to;
  if (employee_id) params.employee_id = employee_id;
  if (vehicle_id) params.vehicle_id = vehicle_id;
  if (route_id) params.route_id = route_id;
  if (shift_template_id) params.shift_template_id = shift_template_id;
  if (depot_id) params.depot_id = depot_id;
  if (status) params.status = status;
  const res = await api.get("/assignments", { params });
  return res.data;
}

export async function fetchAssignmentsByDate(date, { depot_id } = {}) {
  const params = { date };
  if (depot_id) params.depot_id = depot_id;
  const res = await api.get("/assignments/by-date", { params });
  return res.data;
}

export async function fetchAssignmentStats({ date, from, to, depot_id } = {}) {
  const params = {};
  if (date) params.date = date;
  if (from) params.from = from;
  if (to) params.to = to;
  if (depot_id) params.depot_id = depot_id;
  const res = await api.get("/assignments/stats", { params });
  return res.data;
}

export async function fetchAssignmentById(id) {
  const res = await api.get(`/assignments/${id}`);
  return res.data;
}

export async function suggestBlocks(payload) {
  const res = await api.post("/assignments/suggest", payload);
  return res.data;
}

export async function createAssignment(payload) {
  const res = await api.post("/assignments", payload);
  return res.data;
}

export async function bulkCreateAssignments(payload) {
  const res = await api.post("/assignments/bulk", payload);
  return res.data;
}

export async function updateAssignment(id, payload) {
  const res = await api.put(`/assignments/${id}`, payload);
  return res.data;
}

export async function changeAssignmentStatus(id, status) {
  const res = await api.patch(`/assignments/${id}/status`, { status });
  return res.data;
}

export async function deleteAssignment(id) {
  const res = await api.delete(`/assignments/${id}`);
  return res.data;
}
