import * as proxy from "./routeProxyClient.js";

const MAX_WALK_DISTANCE_M = 400;

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatStop(s, extra = {}) {
  return {
    id: s.id,
    code: s.stop_id,
    name: s.stop_name,
    type: s.stop_type === 1 ? "depot" : "stop",
    latitude: s.latitude != null ? parseFloat(s.latitude) : null,
    longitude: s.longitude != null ? parseFloat(s.longitude) : null,
    is_active: s.is_active,
    ...extra,
  };
}

function formatRouteSummary(r) {
  return {
    id: r.id,
    code: r.route_id,
    short_name: r.route_short_name,
    full_name: r.route_full_name,
    color: r.route_color,
    is_active: r.is_active,
  };
}

export async function getNearbyStops({
  lat,
  lng,
  radius = 1000,
  limit = 20,
} = {}) {
  const la = parseFloat(lat);
  const ln = parseFloat(lng);
  if (isNaN(la) || isNaN(ln)) {
    const err = new Error("lat và lng phải là số.");
    err.status = 400;
    throw err;
  }

  const r = Math.min(Math.max(100, parseInt(radius) || 1000), 5000);
  const n = Math.min(Math.max(1, parseInt(limit) || 20), 50);

  const all = await proxy.fetchAllStops();

  const withDist = all
    .filter((s) => s.stop_type !== 1)
    .filter((s) => s.latitude != null && s.longitude != null)
    .map((s) => ({
      ...s,
      distance_m: haversine(
        la,
        ln,
        parseFloat(s.latitude),
        parseFloat(s.longitude),
      ),
    }))
    .filter((s) => s.distance_m <= r)
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, n);

  return withDist.map((s) =>
    formatStop(s, { distance_m: Math.round(s.distance_m) }),
  );
}

export async function getRoutesByStop(stopId) {
  const sid = parseInt(stopId);
  if (isNaN(sid)) {
    const err = new Error("stopId không hợp lệ.");
    err.status = 400;
    throw err;
  }

  const routes = await proxy.fetchAllRoutes();
  const result = [];

  for (const r of routes) {
    try {
      const full = await proxy.fetchFullRoute(r.id);
      const patterns = full.patterns || [];

      const matchedPatterns = [];
      for (const p of patterns) {
        const stopIdx = (p.stops || []).findIndex((s) => s.id === sid);
        if (stopIdx !== -1) {
          matchedPatterns.push({
            direction_id: p.direction_id,
            trip_headsign: p.trip_headsign,
            stop_sequence: p.stops[stopIdx].stop_sequence,
          });
        }
      }

      if (matchedPatterns.length > 0) {
        result.push({
          ...formatRouteSummary(r),
          patterns: matchedPatterns,
        });
      }
    } catch (err) {}
  }

  return result;
}

export async function getRouteDetail(routeId) {
  const rid = parseInt(routeId);
  if (isNaN(rid)) {
    const err = new Error("routeId không hợp lệ.");
    err.status = 400;
    throw err;
  }

  const full = await proxy.fetchFullRoute(rid);

  const patterns = (full.patterns || []).map((p) => ({
    direction_id: p.direction_id,
    trip_headsign: p.trip_headsign,
    shape: p.shape,
    stops: (p.stops || []).map((s, idx) => ({
      sequence: idx + 1,
      id: s.id,
      code: s.stop_id,
      name: s.stop_name,
      type: s.stop_type === 1 ? "depot" : "stop",
      latitude: parseFloat(s.latitude),
      longitude: parseFloat(s.longitude),
      arrival_offset_sec: s.arrival_offset_seconds,
      departure_offset_sec: s.departure_offset_seconds,
    })),
  }));

  let startTime = null;
  let endTime = null;
  for (const p of patterns) {
    if (p.stops.length > 0) {
      const first = p.stops[0].departure_offset_sec || 0;
      const last = p.stops[p.stops.length - 1].arrival_offset_sec || 0;
      if (startTime == null || first < startTime) startTime = first;
      if (endTime == null || last > endTime) endTime = last;
    }
  }

  return {
    route: formatRouteSummary(full.route),
    patterns,
    operating_offset: {
      start_seconds: startTime,
      end_seconds: endTime,
    },
  };
}

export async function searchDirectRoutes(fromStopId, toStopId) {
  const fromId = parseInt(fromStopId);
  const toId = parseInt(toStopId);
  if (isNaN(fromId) || isNaN(toId)) {
    const err = new Error("fromStopId và toStopId là bắt buộc.");
    err.status = 400;
    throw err;
  }
  if (fromId === toId) {
    const err = new Error("Điểm đi và điểm đến phải khác nhau.");
    err.status = 400;
    throw err;
  }

  const routes = await proxy.fetchAllRoutes();
  const result = [];

  for (const r of routes) {
    try {
      const full = await proxy.fetchFullRoute(r.id);
      const patterns = full.patterns || [];

      for (const p of patterns) {
        const stops = p.stops || [];
        const fromIdx = stops.findIndex((s) => s.id === fromId);
        const toIdx = stops.findIndex((s) => s.id === toId);

        if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
          const fromStop = stops[fromIdx];
          const toStop = stops[toIdx];

          result.push({
            route: formatRouteSummary(r),
            direction_id: p.direction_id,
            trip_headsign: p.trip_headsign,
            from_stop: {
              id: fromStop.id,
              name: fromStop.stop_name,
              sequence: fromIdx + 1,
            },
            to_stop: {
              id: toStop.id,
              name: toStop.stop_name,
              sequence: toIdx + 1,
            },
            stop_count: toIdx - fromIdx + 1,
            travel_time_min: Math.round(
              (toStop.arrival_offset_seconds -
                fromStop.departure_offset_seconds) /
                60,
            ),
          });
        }
      }
    } catch (err) {}
  }

  result.sort((a, b) => a.travel_time_min - b.travel_time_min);

  return result;
}

export async function getRouteSchedule(routeId, date) {
  const rid = parseInt(routeId);
  if (isNaN(rid)) {
    const err = new Error("routeId không hợp lệ.");
    err.status = 400;
    throw err;
  }

  const d = date || new Date().toISOString().slice(0, 10);

  const stats = await proxy.fetchRouteStatsByDate(rid, d);

  return {
    route_id: rid,
    date: d,
    day_of_week: stats.day_of_week,
    services_active: stats.services_active || [],
    trip_count: stats.trip_count || { go: 0, return: 0, total: 0 },
    operating_window: stats.operating_window || {
      first_trip: null,
      last_trip: null,
    },
    headway: stats.headway,
  };
}

export async function searchTransferRoutes(
  fromStopId,
  toStopId,
  { maxResults = 5 } = {},
) {
  const fromId = parseInt(fromStopId);
  const toId = parseInt(toStopId);
  if (isNaN(fromId) || isNaN(toId)) {
    const err = new Error("fromStopId và toStopId là bắt buộc.");
    err.status = 400;
    throw err;
  }

  const routes = await proxy.fetchAllRoutes();

  const allStops = await proxy.fetchAllStops();
  const stopsMap = new Map(allStops.map((s) => [s.id, s]));

  const stopRoutesMap = new Map();
  const routeDetailsCache = new Map();

  for (const r of routes) {
    try {
      const full = await proxy.fetchFullRoute(r.id);
      routeDetailsCache.set(r.id, full);

      for (const p of full.patterns || []) {
        (p.stops || []).forEach((s, idx) => {
          if (!stopRoutesMap.has(s.id)) stopRoutesMap.set(s.id, []);
          stopRoutesMap.get(s.id).push({
            route: r,
            pattern: p,
            stopIndex: idx,
          });
        });
      }
    } catch (err) {}
  }

  const routesFrom = stopRoutesMap.get(fromId) || [];
  const routesTo = stopRoutesMap.get(toId) || [];
  const transfers = [];

  for (const rf of routesFrom) {
    for (const rt of routesTo) {
      if (rf.route.id === rt.route.id) continue;

      const rfStops = rf.pattern.stops.slice(rf.stopIndex + 1);
      const rtStops = rt.pattern.stops.slice(0, rt.stopIndex);

      for (const x of rfStops) {
        const matchIdx = rtStops.findIndex((s) => s.id === x.id);
        if (matchIdx !== -1) {
          const transferStop = rtStops[matchIdx];
          transfers.push({
            transfer_type: "same_stop",
            walk_distance_m: 0,
            transfer_stop: {
              id: transferStop.id,
              name: transferStop.stop_name,
            },
            route_1: {
              ...formatRouteSummary(rf.route),
              direction_id: rf.pattern.direction_id,
            },
            route_2: {
              ...formatRouteSummary(rt.route),
              direction_id: rt.pattern.direction_id,
            },
          });
        }
      }
    }
  }

  for (const rf of routesFrom) {
    for (const rt of routesTo) {
      if (rf.route.id === rt.route.id) continue;

      const rfStops = rf.pattern.stops.slice(rf.stopIndex + 1);
      const rtStops = rt.pattern.stops.slice(0, rt.stopIndex);

      for (const stopA of rfStops) {
        for (const stopB of rtStops) {
          if (stopA.id === stopB.id) continue;

          const dist = haversine(
            stopA.latitude,
            stopA.longitude,
            stopB.latitude,
            stopB.longitude,
          );

          if (dist <= MAX_WALK_DISTANCE_M) {
            transfers.push({
              transfer_type: "walk",
              walk_distance_m: Math.round(dist),
              transfer_stop: { id: stopA.id, name: stopA.stop_name },
              transfer_stop_to: { id: stopB.id, name: stopB.stop_name },
              route_1: {
                ...formatRouteSummary(rf.route),
                direction_id: rf.pattern.direction_id,
              },
              route_2: {
                ...formatRouteSummary(rt.route),
                direction_id: rt.pattern.direction_id,
              },
            });
          }
        }
      }
    }
  }

  transfers.sort((a, b) => a.walk_distance_m - b.walk_distance_m);

  const uniqueTransfers = [];
  const seen = new Set();
  for (const t of transfers) {
    const key = `${t.route_1.id}-${t.route_2.id}-${t.transfer_stop.id}-${t.transfer_type}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTransfers.push(t);
    }
  }

  return uniqueTransfers.slice(0, maxResults);
}

export async function getRouteTrips(routeId, date) {
  const rid = parseInt(routeId);
  if (isNaN(rid)) {
    const err = new Error("routeId không hợp lệ.");
    err.status = 400;
    throw err;
  }

  const d = date || new Date().toISOString().slice(0, 10);
  const stats = await proxy.fetchRouteStatsByDate(rid, d);
  const activeServices = stats.services_active || [];

  const allTrips = await proxy.fetchTripsByRoute(rid);

  const filtered = allTrips
    .filter(
      (t) =>
        activeServices.length === 0 || activeServices.includes(t.service_code),
    )
    .map((t) => ({
      id: t.id,
      trip_code: t.trip_id,
      start_time: t.start_time,
      direction_id: t.direction_id,
      direction_label: t.direction_id === 0 ? "Chiều đi" : "Chiều về",
      headsign: t.trip_headsign,
      service_code: t.service_code,
      is_active: t.is_active,
    }))
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

  return {
    route_id: rid,
    date: d,
    services_active: activeServices,
    trips: filtered,
    total: filtered.length,
  };
}

export async function getMapNetwork() {
  const routes = await proxy.fetchAllRoutes();
  const network = [];

  for (const r of routes) {
    if (!r.is_active) continue;

    try {
      const full = await proxy.fetchFullRoute(r.id);
      const patterns = (full.patterns || []).map((p) => ({
        direction_id: p.direction_id,
        trip_headsign: p.trip_headsign,
        shape: p.shape,
        stops: (p.stops || []).map((s) => ({
          id: s.id,
          name: s.stop_name,
          latitude: parseFloat(s.latitude),
          longitude: parseFloat(s.longitude),
          type: s.stop_type === 1 ? "depot" : "stop",
          sequence: s.stop_sequence,
        })),
      }));

      network.push({
        route: formatRouteSummary(r),
        patterns,
      });
    } catch (err) {}
  }

  return {
    total_routes: network.length,
    network,
  };
}

export async function getAllStopsForSearch() {
  const all = await proxy.fetchAllStops();
  return all.map((s) => formatStop(s));
}
