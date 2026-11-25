import api from "./client";

export async function getNearbyStops({ lat, lng, radius = 1000, limit = 20 }) {
  const res = await api.get("/discovery/stops/nearby", {
    params: { lat, lng, radius, limit },
  });
  return res.data;
}

export async function getRoutesByStop(stopId) {
  const res = await api.get(`/discovery/stops/${stopId}/routes`);
  return res.data;
}

export async function getRouteDetail(routeId) {
  const res = await api.get(`/discovery/routes/${routeId}`);
  return res.data;
}

export async function searchDirectRoutes({ from, to }) {
  const res = await api.get("/discovery/routes/search", {
    params: { from, to },
  });
  return res.data;
}

export async function getRouteSchedule(routeId, date) {
  const res = await api.get(`/discovery/routes/${routeId}/schedule`, {
    params: { date },
  });
  return res.data;
}

export async function searchTransferRoutes({ from, to, limit = 5 }) {
  const res = await api.get("/discovery/routes/transfer", {
    params: { from, to, limit },
  });
  return res.data;
}

export async function getRouteTrips(routeId, date) {
  const res = await api.get(`/discovery/routes/${routeId}/trips`, {
    params: { date },
  });
  return res.data;
}

export async function getMapNetwork() {
  const res = await api.get("/discovery/map/network");
  return res.data;
}

export async function getAllStops() {
  const res = await api.get("/discovery/stops/all");
  return res.data;
}
