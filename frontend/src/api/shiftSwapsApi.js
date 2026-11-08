import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLEET_API_BASE_URL || "/fleet",
  timeout: 20000,
});

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════
export async function fetchSwaps({
  from,
  to,
  original_employee_id,
  substitute_employee_id,
  status,
  page = 1,
  limit = 50,
} = {}) {
  const params = { page, limit };
  if (from) params.from = from;
  if (to) params.to = to;
  if (original_employee_id) params.original_employee_id = original_employee_id;
  if (substitute_employee_id)
    params.substitute_employee_id = substitute_employee_id;
  if (status) params.status = status;
  const res = await api.get("/swaps", { params });
  return res.data;
}

export async function fetchSwapsByDate(date) {
  const res = await api.get("/swaps/by-date", { params: { date } });
  return res.data;
}

export async function fetchSwapStats({ from, to } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await api.get("/swaps/stats", { params });
  return res.data;
}

export async function suggestSubstitutes(assignmentId) {
  const res = await api.post("/swaps/suggest", {
    assignment_id: assignmentId,
  });
  return res.data;
}

export async function createSwap(payload) {
  const res = await api.post("/swaps", payload);
  return res.data;
}
export async function fetchSwapById(id) {
  const res = await api.get(`/swaps/${id}`);
  return res.data;
}

export async function deleteSwap(id) {
  const res = await api.delete(`/swaps/${id}`);
  return res.data;
}
