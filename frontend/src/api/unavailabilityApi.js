import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLEET_API_BASE_URL || "/fleet",
  timeout: 15000,
});

export async function fetchUnavailability({
  driver_id,
  from,
  to,
  page = 1,
  limit = 20,
} = {}) {
  const params = { page, limit };
  if (driver_id) params.driver_id = driver_id;
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await api.get("/unavailability", { params });
  return res.data;
}
