import axios from "axios";

const ROUTE_BASE =
  process.env.ROUTE_SERVICE_URL || "http://localhost:3000/tbus";
const TIMEOUT = 15000;

const api = axios.create({
  baseURL: ROUTE_BASE,
  timeout: TIMEOUT,
});

const cache = new Map();
const TTL = 5 * 60 * 1000;
const MAX = 500;

function cacheGet(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function cacheSet(key, data) {
  if (cache.size >= MAX) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, { data, ts: Date.now() });
}

export function clearCache() {
  cache.clear();
}

export async function fetchAllStops() {
  const key = "all-stops";
  const cached = cacheGet(key);
  if (cached) return cached;

  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await api.get("/stops", {
      params: { page, limit: 200 },
    });
    all.push(...(res.data.data || []));
    totalPages = res.data.totalPages || 1;
    page++;
  } while (page <= totalPages);

  cacheSet(key, all);
  return all;
}

export async function fetchAllRoutes() {
  const key = "all-routes";
  const cached = cacheGet(key);
  if (cached) return cached;

  const res = await api.get("/routes", { params: { page: 1, limit: 200 } });
  const all = res.data.data || [];
  cacheSet(key, all);
  return all;
}

export async function fetchFullRoute(routeId) {
  const key = `full-route-${routeId}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const res = await api.get(`/routes/${routeId}/full`);
  cacheSet(key, res.data);
  return res.data;
}

export async function fetchRouteStatsByDate(routeId, date) {
  const key = `route-stats-${routeId}-${date}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const res = await api.get(`/routes/${routeId}/stats`, {
    params: { date },
  });
  cacheSet(key, res.data);
  return res.data;
}

export async function fetchTripsByRoute(routeId) {
  const key = `trips-${routeId}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const res = await api.get("/trips", {
    params: { route_id: routeId, page: 1, limit: 500 },
  });
  const data = res.data.data || [];
  cacheSet(key, data);
  return data;
}
