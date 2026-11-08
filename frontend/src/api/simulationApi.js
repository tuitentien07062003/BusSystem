import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/tbus",
  timeout: 20000,
});

export async function fetchFullRoute(routeId) {
  const res = await api.get(`/routes/${routeId}/full`);
  return res.data;
}

export async function fetchRouteTrips(routeId, limit = 30) {
  const res = await api.get("/trips", {
    params: { route_id: routeId, limit, page: 1 },
  });
  return res.data;
}

export async function fetchSimAssignments({ date, route_id }) {
  const params = { date, limit: 200 };
  if (route_id) params.route_id = route_id;
  const res = await fleetApi.get("/assignments", { params });
  return res.data;
}
