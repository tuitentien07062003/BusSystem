const ROUTE_SERVICE_URL =
  process.env.ROUTE_SERVICE_URL || "http://localhost:3000/tbus";

const FETCH_TIMEOUT_MS = 10000;

const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 500;

function cacheGet(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function cacheSet(key, data) {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, ts: Date.now() });
}

export function clearRouteServiceCache() {
  cache.clear();
}

export function getCacheStats() {
  return { size: cache.size, max: CACHE_MAX };
}

// ═══════════════════════════════════════════════════════════════
// Fetch wrapper với timeout
// ═══════════════════════════════════════════════════════════════
async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`RouteService HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /routes/:id/stats?date=YYYY-MM-DD
// → trả trip_count, services_active, operating_window
// ═══════════════════════════════════════════════════════════════
export async function fetchRouteStats(routeId, date) {
  const key = `stats:${routeId}:${date}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = `${ROUTE_SERVICE_URL}/routes/${routeId}/stats?date=${date}`;
  const data = await fetchJson(url);
  cacheSet(key, data);
  return data;
}

// ═══════════════════════════════════════════════════════════════
// GET /routes/:id
// → thông tin tuyến (depot_id, route_full_name, ...)
// ═══════════════════════════════════════════════════════════════
export async function fetchRouteById(routeId) {
  const key = `route:${routeId}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = `${ROUTE_SERVICE_URL}/routes/${routeId}`;
  const data = await fetchJson(url);
  cacheSet(key, data);
  return data;
}

// ═══════════════════════════════════════════════════════════════
// GET /trips?route_id=X&limit=500
// → list trips của tuyến (không filter date)
// ═══════════════════════════════════════════════════════════════
export async function fetchAllTripsOfRoute(routeId, { limit = 500 } = {}) {
  const key = `trips:${routeId}:${limit}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = `${ROUTE_SERVICE_URL}/trips?route_id=${routeId}&limit=${limit}`;
  const data = await fetchJson(url);
  cacheSet(key, data);
  return data;
}

// ═══════════════════════════════════════════════════════════════
// HIGH-LEVEL: lấy trips active của tuyến trong 1 ngày cụ thể
// Kết hợp: stats (lấy services_active) + trips (filter theo service_code)
// ═══════════════════════════════════════════════════════════════
export async function fetchTripsByRouteAndDate(routeId, date) {
  const key = `trips-by-date:${routeId}:${date}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  // ── Bước 1: lấy services active ──
  const stats = await fetchRouteStats(routeId, date);
  const activeServices = stats.services_active || [];

  if (activeServices.length === 0) {
    const empty = { total: 0, data: [] };
    cacheSet(key, empty);
    return empty;
  }

  // ── Bước 2: lấy tất cả trips ──
  const all = await fetchAllTripsOfRoute(routeId, { limit: 500 });
  const allTrips = all.data || [];

  // ── Bước 3: filter theo service_code ──
  const filtered = allTrips.filter((t) =>
    activeServices.includes(t.service_code),
  );

  // ── Bước 4: sort theo start_time ──
  filtered.sort((a, b) =>
    String(a.start_time).localeCompare(String(b.start_time)),
  );

  const result = {
    total: filtered.length,
    date,
    services_active: activeServices,
    data: filtered,
  };

  cacheSet(key, result);
  return result;
}
