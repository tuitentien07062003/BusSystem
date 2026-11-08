import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLEET_API_BASE_URL || "/fleet",
  timeout: 15000,
});

export async function fetchVehicles({
  page = 1,
  limit = 10,
  depot_id,
  vehicle_type_id,
  is_active,
  q,
} = {}) {
  const params = { page, limit };
  if (depot_id) params.depot_id = depot_id;
  if (vehicle_type_id) params.vehicle_type_id = vehicle_type_id;
  if (typeof is_active === "boolean") params.is_active = is_active;
  if (q && q.trim()) params.q = q.trim();

  const res = await api.get("/vehicles", { params });
  return res.data;
}

export async function fetchVehicleStats() {
  const res = await api.get("/vehicles/stats");
  return res.data;
}

export async function fetchVehicleTypes() {
  const res = await api.get("/vehicles/types");
  return res.data;
}

export async function fetchVehicleById(id) {
  const res = await api.get(`/vehicles/${id}`);
  return res.data;
}

export async function createVehicle(payload) {
  const res = await api.post("/vehicles", payload);
  return res.data;
}

export async function updateVehicle(id, payload) {
  const res = await api.put(`/vehicles/${id}`, payload);
  return res.data;
}

export async function changeVehicleStatus(id, is_active) {
  const res = await api.patch(`/vehicles/${id}/status`, { is_active });
  return res.data;
}
