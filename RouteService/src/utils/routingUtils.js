const DEFAULT_OSRM = "https://router.project-osrm.org";

const routeCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 200;

function makeCacheKey(points) {
  return points
    .map((p) => `${Number(p.latitude).toFixed(6)},${Number(p.longitude).toFixed(6)}`)
    .join("|");
}

function getCached(key) {
  const item = routeCache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL_MS) {
    routeCache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  if (routeCache.size >= CACHE_MAX) {
    const firstKey = routeCache.keys().next().value;
    routeCache.delete(firstKey);
  }
  routeCache.set(key, { data, ts: Date.now() });
}

export async function fetchRouteGeometry(points, options = {}) {
  if (!points || points.length < 2) {
    throw new Error("Cần ít nhất 2 điểm để tính tuyến.");
  }

  const cacheKey = makeCacheKey(points);
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, from_cache: true };

  const baseUrl = options.baseUrl || process.env.OSRM_BASE_URL || DEFAULT_OSRM;
  const timeoutMs = options.timeoutMs || 15000;

  const coordsParam = points
    .map((p) => `${Number(p.longitude)},${Number(p.latitude)}`)
    .join(";");

  const url =
    `${baseUrl}/route/v1/driving/${coordsParam}` +
    `?geometries=geojson&overview=full&steps=false&annotations=false`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();

    if (data.code !== "Ok" || !data.routes?.length) {
      throw new Error(`OSRM trả về lỗi: ${data.code || "no route"}`);
    }

    const route = data.routes[0];
    const result = {
      geometry: route.geometry,
      distance_m: route.distance,
      duration_sec: route.duration,
    };
    setCache(cacheKey, result);
    return { ...result, from_cache: false };
  } finally {
    clearTimeout(timer);
  }
}

export function getCacheStats() {
  return { size: routeCache.size, max: CACHE_MAX };
}
