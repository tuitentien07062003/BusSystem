import * as turf from "@turf/turf";
import {
  SIM_STEP,
  AVG_SPEED_MPS,
  MIN_DWELL_SEC,
  MAX_DWELL_SEC,
} from "./simConstants";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function parseTimeToSec(t) {
  if (!t) return 0;
  const [h, m, s = 0] = String(t).split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function detectDirection(tripId) {
  if (!tripId) return 0;
  if (tripId.includes("_GO_")) return 0;
  if (tripId.includes("_RET_")) return 1;
  return 0;
}

class SimulationEngine {
  constructor() {
    this.routesByDir = {};
    this.blocks = []; // ← mỗi block = 1 xe chạy nhiều trips
    this.baseTime = 0;

    this.globalElapsed = 0;
    this.speed = 15;
    this.isRunning = false;
    this.isPaused = false;
    this.rafId = null;
    this.lastFrameTime = 0;
    this.accumulator = 0;
    this.listeners = new Set();

    this.loop = this.loop.bind(this);
  }

  // ═══════════════════════════════════════════════════════════════
  // LOAD ROUTE — patterns + stops (giữ nguyên)
  // ═══════════════════════════════════════════════════════════════
  loadRoute(patterns) {
    this.routesByDir = {};

    for (const pattern of patterns) {
      const dir = pattern.direction_id;
      const shape = pattern.shape;
      const stops = pattern.stops || [];
      if (!shape?.coordinates?.length || stops.length === 0) continue;

      const routePoints = [];
      let dist = 0;
      const coords = shape.coordinates;
      routePoints.push({ dist: 0, lat: coords[0][1], lng: coords[0][0] });
      for (let i = 1; i < coords.length; i++) {
        const [lng1, lat1] = coords[i - 1];
        const [lng2, lat2] = coords[i];
        const d = turf.distance([lng1, lat1], [lng2, lat2], {
          units: "kilometers",
        });
        dist += d;
        routePoints.push({ dist, lat: lat2, lng: lng2 });
      }

      const sortedStops = [...stops].sort(
        (a, b) => a.stop_sequence - b.stop_sequence,
      );
      this.normalizeStops(sortedStops);

      const stopDistCache = sortedStops.map((s) => {
        let bestDist = 0;
        let minD = Infinity;
        for (const p of routePoints) {
          const d = turf.distance([s.longitude, s.latitude], [p.lng, p.lat], {
            units: "kilometers",
          });
          if (d < minD) {
            minD = d;
            bestDist = p.dist;
          }
        }
        return bestDist;
      });
      for (let i = 1; i < stopDistCache.length; i++) {
        if (stopDistCache[i] <= stopDistCache[i - 1]) {
          stopDistCache[i] = stopDistCache[i - 1] + 0.01;
        }
      }

      this.routesByDir[dir] = {
        direction_id: dir,
        pattern_id: pattern.id,
        trip_headsign: pattern.trip_headsign,
        shape,
        stops: sortedStops,
        routePoints,
        stopDistCache,
        totalDist: dist,
        routeColor: dir === 0 ? "#169BA2" : "#9333EA",
      };
    }
  }

  normalizeStops(stops) {
    for (let i = 0; i < stops.length; i++) {
      const cur = stops[i];
      if (
        cur.departure_offset_seconds == null ||
        cur.departure_offset_seconds <
          cur.arrival_offset_seconds + MIN_DWELL_SEC
      ) {
        cur.departure_offset_seconds =
          cur.arrival_offset_seconds + MIN_DWELL_SEC;
      }
      const dwell = cur.departure_offset_seconds - cur.arrival_offset_seconds;
      if (dwell > MAX_DWELL_SEC) {
        cur.departure_offset_seconds =
          cur.arrival_offset_seconds + MAX_DWELL_SEC;
      }
      if (i < stops.length - 1) {
        const next = stops[i + 1];
        const distKm = turf.distance(
          [cur.longitude, cur.latitude],
          [next.longitude, next.latitude],
          { units: "kilometers" },
        );
        const travelSec = Math.max(
          30,
          Math.round((distKm * 1000) / AVG_SPEED_MPS),
        );
        next.arrival_offset_seconds = cur.departure_offset_seconds + travelSec;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LOAD BLOCKS — mỗi assignment + filter trips trong khung giờ
  // ═══════════════════════════════════════════════════════════════
  loadBlocks(assignments, allTrips) {
    if (!assignments || assignments.length === 0) {
      this.blocks = [];
      return;
    }

    const tripsByTripId = new Map(allTrips.map((t) => [t.trip_id, t]));

    const blocks = assignments.map((a) => {
      const startSec = parseTimeToSec(a.start_time);
      const endSec = parseTimeToSec(a.end_time);

      // Filter trips của tuyến trong khung giờ
      const matchingTrips = allTrips
        .filter((t) => {
          const tStart = parseTimeToSec(t.start_time);
          return tStart >= startSec && tStart < endSec;
        })
        .sort(
          (x, y) => parseTimeToSec(x.start_time) - parseTimeToSec(y.start_time),
        )
        .map((t) => {
          const dir = detectDirection(t.trip_id);
          const tStart = parseTimeToSec(t.start_time);
          const travelSec = t.travel_time_sec || 60 * 60;
          return {
            trip_id: t.trip_id,
            direction_id: dir,
            start_sec: tStart,
            end_sec: tStart + travelSec,
            travel_time_sec: travelSec,
          };
        });

      return {
        id: a.id,
        vehicle_id: a.vehicle_id,
        vehicle_code: a.vehicle?.vehicle_code || `#${a.vehicle_id}`,
        license_plate: a.vehicle?.license_plate || "",
        driver_id: a.employee_id,
        driver_code: a.driver?.employee_code || "",
        driver_name: a.driver?.full_name || "",
        co_driver_code: a.co_driver?.employee_code || "",
        co_driver_name: a.co_driver?.full_name || "",
        route_id: a.route_id,
        depot_id: a.depot_id,
        start_time: a.start_time,
        end_time: a.end_time,
        trips: matchingTrips,
        // Runtime state
        latlng: [10.82, 106.74],
        status: "waiting",
        direction_id: 0,
        active_trip: null,
      };
    });

    this.blocks = blocks;

    // Base time = min start_sec của trip đầu tiên
    const allStarts = blocks.flatMap((b) => b.trips.map((t) => t.start_sec));
    this.baseTime = allStarts.length > 0 ? Math.min(...allStarts) : 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // RUNTIME CONTROLS (giữ nguyên)
  // ═══════════════════════════════════════════════════════════════
  start(speed) {
    if (this.isRunning) return;
    this.speed = speed || this.speed;
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  reset() {
    this.stop();
    this.globalElapsed = 0;
    this.accumulator = 0;
    for (const b of this.blocks) {
      b.status = "waiting";
      b.active_trip = null;
      const firstTrip = b.trips[0];
      if (firstTrip) {
        const route = this.routesByDir[firstTrip.direction_id];
        b.direction_id = firstTrip.direction_id;
        if (route?.stops[0]) {
          b.latlng = [route.stops[0].latitude, route.stops[0].longitude];
        }
      }
    }
  }

  setSpeed(v) {
    this.speed = Math.max(1, Math.min(200, parseInt(v) || 15));
  }

  // ═══════════════════════════════════════════════════════════════
  // POSITION MATH (giữ nguyên)
  // ═══════════════════════════════════════════════════════════════
  getPointAtDistance(route, dist) {
    const pts = route.routePoints;
    if (!pts.length) return null;
    if (dist <= 0) return { lat: pts[0].lat, lng: pts[0].lng };
    if (dist >= route.totalDist) {
      const last = pts[pts.length - 1];
      return { lat: last.lat, lng: last.lng };
    }
    let lo = 0;
    let hi = pts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].dist < dist) lo = mid + 1;
      else hi = mid;
    }
    const idx = Math.min(lo, pts.length - 1);
    if (idx === 0) return { lat: pts[0].lat, lng: pts[0].lng };
    const p0 = pts[idx - 1];
    const p1 = pts[idx];
    const seg = p1.dist - p0.dist;
    const t = seg > 0 ? (dist - p0.dist) / seg : 0;
    return {
      lat: p0.lat + (p1.lat - p0.lat) * t,
      lng: p0.lng + (p1.lng - p0.lng) * t,
    };
  }

  getPositionAtTime(direction, te) {
    const route = this.routesByDir[direction];
    if (!route) return null;
    const stops = route.stops;
    if (te <= 0) {
      return {
        latlng: [stops[0].latitude, stops[0].longitude],
        idx: 0,
        dwell: true,
      };
    }
    const EPS = 0.01;
    for (let i = 0; i < stops.length - 1; i++) {
      const cur = stops[i];
      const next = stops[i + 1];
      if (
        te >= cur.arrival_offset_seconds - EPS &&
        te < cur.departure_offset_seconds + EPS
      ) {
        return {
          latlng: [cur.latitude, cur.longitude],
          idx: i,
          dwell: true,
        };
      }
      if (
        te >= cur.departure_offset_seconds - EPS &&
        te < next.arrival_offset_seconds + EPS
      ) {
        const travelTime =
          next.arrival_offset_seconds - cur.departure_offset_seconds;
        if (travelTime <= 0) {
          return {
            latlng: [next.latitude, next.longitude],
            idx: i + 1,
            dwell: false,
          };
        }
        const seg = Math.min(
          Math.max((te - cur.departure_offset_seconds) / travelTime, 0),
          1,
        );
        const dKm =
          route.stopDistCache[i] +
          (route.stopDistCache[i + 1] - route.stopDistCache[i]) * seg;
        const pt = this.getPointAtDistance(route, dKm);
        return { latlng: [pt.lat, pt.lng], idx: i, dwell: false };
      }
    }
    const last = stops[stops.length - 1];
    return {
      latlng: [last.latitude, last.longitude],
      idx: stops.length - 1,
      dwell: true,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // UPDATE BLOCK — tìm trip đang active trong block
  // ═══════════════════════════════════════════════════════════════
  updateBlock(block, elapsed) {
    if (!block.trips || block.trips.length === 0) {
      block.status = "waiting";
      return;
    }

    const absTime = this.baseTime + elapsed;

    // Tìm active trip
    let activeTrip = null;
    for (const trip of block.trips) {
      if (absTime >= trip.start_sec && absTime < trip.end_sec) {
        activeTrip = trip;
        break;
      }
    }

    if (activeTrip) {
      const te = absTime - activeTrip.start_sec;
      const pos = this.getPositionAtTime(activeTrip.direction_id, te);
      if (pos) {
        block.latlng = pos.latlng;
        block.direction_id = activeTrip.direction_id;
        block.status = pos.dwell ? "stopped" : "running";
        block.active_trip = activeTrip;
      }
      return;
    }

    // Không trong trip nào — check trước trip đầu tiên hoặc giữa các trip
    const nextTrip = block.trips.find((t) => absTime < t.start_sec);
    if (nextTrip) {
      // Đợi ở trạm đầu của trip sắp chạy
      const route = this.routesByDir[nextTrip.direction_id];
      if (route?.stops[0]) {
        block.latlng = [route.stops[0].latitude, route.stops[0].longitude];
        block.direction_id = nextTrip.direction_id;
      }
      block.status = "waiting";
      block.active_trip = null;
      return;
    }

    // Xong tất cả trips
    block.status = "done";
    block.active_trip = null;
    const lastTrip = block.trips[block.trips.length - 1];
    const route = this.routesByDir[lastTrip.direction_id];
    if (route) {
      const lastStop = route.stops[route.stops.length - 1];
      block.latlng = [lastStop.latitude, lastStop.longitude];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LOOP (giữ nguyên cấu trúc)
  // ═══════════════════════════════════════════════════════════════
  loop(now) {
    if (!this.isRunning || this.isPaused) return;
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;
    this.accumulator += dt * this.speed;

    let steps = 0;
    while (this.accumulator >= SIM_STEP && steps < 30) {
      this.globalElapsed += SIM_STEP;
      this.accumulator -= SIM_STEP;
      steps++;
      for (const b of this.blocks) this.updateBlock(b, this.globalElapsed);
    }

    this.emit();

    if (this.allDone()) {
      this.stop();
      this.emit();
      return;
    }

    this.rafId = requestAnimationFrame(this.loop);
  }

  allDone() {
    return (
      this.blocks.length > 0 && this.blocks.every((b) => b.status === "done")
    );
  }

  currentStopName(block) {
    if (!block.active_trip) return "";
    const route = this.routesByDir[block.active_trip.direction_id];
    if (!route) return "";
    // Find nearest stop by looking at which stop index we're at
    // For simplicity, use first stop or just route.name
    return route.trip_headsign || "";
  }

  // ═══════════════════════════════════════════════════════════════
  // PUBSUB
  // ═══════════════════════════════════════════════════════════════
  onTick(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    for (const fn of this.listeners) fn(this);
  }
}

export const engine = new SimulationEngine();
