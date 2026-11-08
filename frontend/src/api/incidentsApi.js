import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLEET_API_BASE_URL || "/fleet",
  timeout: 15000,
});

export async function fetchIncidents({
  vehicle_id,
  driver_id,
  route_id,
  status,
  from,
  to,
  page = 1,
  limit = 20,
} = {}) {
  const params = { page, limit };
  if (vehicle_id) params.vehicle_id = vehicle_id;
  if (driver_id) params.driver_id = driver_id;
  if (route_id) params.route_id = route_id;
  if (status) params.status = status;
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await api.get("/incidents", { params });
  return res.data;
}
