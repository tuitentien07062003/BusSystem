import { Op, fn, col } from "sequelize";
import sequelize from "../config/database.js";
import Stop from "../models/stopModel.js";
import Route from "../models/routeModel.js";
import TripPattern from "../models/tripPatternModel.js";
import Shape from "../models/shapeModel.js";
import StopTimePattern from "../models/stopTimePatternModel.js";
import Trip from "../models/tripModel.js";
import {
  cumulativeDistances,
  cumulativeDistancesCoords,
  findNearestOnLine,
} from "../utils/geoUtils.js";
import { fetchRouteGeometry } from "../utils/routingUtils.js";
import { matchStops, matchPointToRoad } from "./roadMatcherService.js";
import { validateStopOrder } from "./routeValidatorService.js";
import { validateShape } from "./shapeValidatorService.js";

const AVG_SPEED_MPS = 5.55;
const DWELL_SEC = 20;

function buildWaypointsWithVias(baseWaypoints, viaPoints) {
  if (!viaPoints?.length) return baseWaypoints;
  const viasBySeg = new Map();
  for (const vp of viaPoints) {
    const seg = Number.isInteger(vp.segment_index) ? vp.segment_index : 0;
    if (!viasBySeg.has(seg)) viasBySeg.set(seg, []);
    viasBySeg.get(seg).push(vp);
  }
  for (const arr of viasBySeg.values()) {
    arr.sort((a, b) => (a.offset_in_segment ?? 0) - (b.offset_in_segment ?? 0));
  }
  const result = [];
  for (let i = 0; i < baseWaypoints.length; i++) {
    result.push(baseWaypoints[i]);
    if (i < baseWaypoints.length - 1 && viasBySeg.has(i)) {
      viasBySeg.get(i).forEach((v) => {
        result.push({
          id: null, stop_id: null,
          stop_name: `Via #${i + 1}`,
          latitude: Number(v.latitude),
          longitude: Number(v.longitude),
          stop_type: -1,
          isVia: true,
        });
      });
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// DEPOTS + SEARCH
// ═══════════════════════════════════════════════════════════════
export async function getDepotsForComposer() {
  const rows = await Stop.findAll({
    where: { stop_type: 1, is_active: true },
    attributes: {
      include: [
        [fn("ST_X", col("geom")), "longitude"],
        [fn("ST_Y", col("geom")), "latitude"],
      ],
    },
    order: [["stop_name", "ASC"]],
  });
  return rows.map((r) => {
    const o = r.get({ plain: true });
    return {
      id: o.id, stop_id: o.stop_id, stop_name: o.stop_name,
      latitude: parseFloat(o.latitude), longitude: parseFloat(o.longitude),
    };
  });
}

let _unaccentAvailable = null;
async function checkUnaccent() {
  if (_unaccentAvailable !== null) return _unaccentAvailable;
  try {
    await sequelize.query("SELECT immutable_unaccent('test')");
    _unaccentAvailable = true;
  } catch { _unaccentAvailable = false; }
  return _unaccentAvailable;
}

export async function searchStopsForComposer({ keyword = "", limit = 50 } = {}) {
  limit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
  const kw = String(keyword || "").trim();
  const where = { stop_type: 0, is_active: true };

  if (kw) {
    const hasUnaccent = await checkUnaccent();
    if (hasUnaccent) {
      where[Op.and] = [{
        [Op.or]: [
          sequelize.where(
            sequelize.fn("immutable_unaccent", sequelize.col("stop_name")),
            { [Op.iLike]: sequelize.fn("immutable_unaccent", `%${kw}%`) }
          ),
          sequelize.where(
            sequelize.fn("immutable_unaccent", sequelize.col("stop_id")),
            { [Op.iLike]: sequelize.fn("immutable_unaccent", `%${kw}%`) }
          ),
        ],
      }];
    } else {
      where[Op.or] = [
        { stop_name: { [Op.iLike]: `%${kw}%` } },
        { stop_id: { [Op.iLike]: `%${kw}%` } },
      ];
    }
  }

  const rows = await Stop.findAll({
    where, limit,
    attributes: {
      include: [
        [fn("ST_X", col("geom")), "longitude"],
        [fn("ST_Y", col("geom")), "latitude"],
      ],
    },
    order: [["stop_name", "ASC"]],
  });
  return rows.map((r) => {
    const o = r.get({ plain: true });
    return {
      id: o.id, stop_id: o.stop_id, stop_name: o.stop_name,
      latitude: parseFloat(o.latitude), longitude: parseFloat(o.longitude),
    };
  });
}

async function fetchStopWithCoords(id) {
  const r = await Stop.findByPk(id, {
    attributes: {
      include: [
        [fn("ST_X", col("geom")), "longitude"],
        [fn("ST_Y", col("geom")), "latitude"],
      ],
    },
  });
  if (!r) { const e = new Error(`Không tìm thấy trạm id=${id}.`); e.status = 404; throw e; }
  const o = r.get({ plain: true });
  return {
    id: o.id, stop_id: o.stop_id, stop_name: o.stop_name,
    latitude: parseFloat(o.latitude), longitude: parseFloat(o.longitude),
    stop_type: o.stop_type,
  };
}

// ═══════════════════════════════════════════════════════════════
// MATCH STOPS TO ROAD — API endpoint cho FE
// ═══════════════════════════════════════════════════════════════
export async function matchStopsToRoad(payload = {}) {
  const { stop_ids = [], start_depot_id, end_depot_id } = payload;

  const stops = [];
  if (start_depot_id) stops.push(await fetchStopWithCoords(start_depot_id));
  for (const id of stop_ids) stops.push(await fetchStopWithCoords(id));
  if (end_depot_id) stops.push(await fetchStopWithCoords(end_depot_id));

  const matches = await matchStops(stops, { maxDistanceM: 100 });
  const orderCheck = validateStopOrder(stops);

  return {
    matches,
    order_check: orderCheck,
  };
}

// ═══════════════════════════════════════════════════════════════
// PREVIEW — Pipeline: Validate → Match → Route → Validate
// ═══════════════════════════════════════════════════════════════
export async function previewRoute({
  start_depot_id, end_depot_id,
  stop_ids = [], via_points = [],
  use_road_matching = true,       // mặc định ON
  match_max_distance_m = 100,
}) {
  // ── 1. Validate inputs ──
  if (!start_depot_id || !end_depot_id) {
    const e = new Error("start_depot_id và end_depot_id là bắt buộc.");
    e.status = 400; throw e;
  }
  if (start_depot_id === end_depot_id) {
    const e = new Error("Điểm đầu và điểm cuối phải khác nhau.");
    e.status = 400; throw e;
  }

  const startDepot = await fetchStopWithCoords(start_depot_id);
  const endDepot = await fetchStopWithCoords(end_depot_id);
  if (startDepot.stop_type !== 1 || endDepot.stop_type !== 1) {
    const e = new Error("Điểm đầu và điểm cuối phải là depot.");
    e.status = 400; throw e;
  }

  const stopsOrdered = [];
  for (const id of stop_ids) stopsOrdered.push(await fetchStopWithCoords(id));

  const baseWaypoints = [startDepot, ...stopsOrdered, endDepot];

  // ── 2. Validate stop order ──
  const orderCheck = validateStopOrder(baseWaypoints);

  // ── 3. Stop-to-Road matching ──
  let matchInfo = null;
  let routingWaypoints;

  let effectiveUseMatching = use_road_matching;

  if (use_road_matching) {
    try {
      const matchResults = await matchStops(baseWaypoints, { maxDistanceM: match_max_distance_m });
      const matchedCount = matchResults.filter((m) => m.matched).length;

      // Nếu KHÔNG có stop nào match được → bảng rỗng hoặc chưa có
      // → fallback graceful: dùng geom gốc
      if (matchedCount === 0) {
        console.warn("[Composer] Road matching bật nhưng 0 stop match được. Fallback về geom gốc.");
        effectiveUseMatching = false;
        matchInfo = {
          enabled: false,
          results: matchResults,
          matched_count: 0,
          total: matchResults.length,
          fallback_reason: "no_stops_matched",
        };
      } else {
        matchInfo = {
          enabled: true,
          results: matchResults,
          matched_count: matchedCount,
          total: matchResults.length,
        };

        const matchedWaypoints = baseWaypoints.map((p, i) => ({
          ...p,
          latitude: matchResults[i].matched_latitude,
          longitude: matchResults[i].matched_longitude,
        }));

        routingWaypoints = buildWaypointsWithVias(matchedWaypoints, via_points);
      }
    } catch (err) {
      console.error("[Composer] Road matching lỗi, fallback về geom gốc:", err.message);
      effectiveUseMatching = false;
      matchInfo = {
        enabled: false,
        results: [],
        matched_count: 0,
        total: baseWaypoints.length,
        fallback_reason: "error",
        error: err.message,
      };
    }
  }

  if (!effectiveUseMatching) {
    if (!matchInfo) {
      matchInfo = { enabled: false, results: [] };
    }
    routingWaypoints = buildWaypointsWithVias(baseWaypoints, via_points);
  }

  // ── 4. Road Network Routing (OSRM) ──
  let routeResult;
  let routing_engine = "osrm";
  try {
    routeResult = await fetchRouteGeometry(routingWaypoints, { timeoutMs: 15000 });
  } catch (err) {
    console.warn("[OSRM] Fallback:", err.message);
    routing_engine = "straight-line";
    const fallbackCoords = routingWaypoints.map((p) => [p.longitude, p.latitude]);
    const cum = cumulativeDistances(routingWaypoints);
    routeResult = {
      geometry: { type: "LineString", coordinates: fallbackCoords },
      distance_m: cum[cum.length - 1] || 0,
      duration_sec: 0,
    };
  }

  // ── 5. Generate LineString + Tính toán ──
  const coords = routeResult.geometry.coordinates;
  const cumDists = cumulativeDistancesCoords(coords);
  const totalDistM = cumDists[cumDists.length - 1];

  const points = baseWaypoints.map((p, idx) => {
    // Snap TRÊN shape theo routing coords (khớp với waypoint đã gửi OSRM)
    const rLat = effectiveUseMatching && matchInfo.results[idx]
      ? matchInfo.results[idx].matched_latitude
      : p.latitude;
    const rLng = effectiveUseMatching && matchInfo.results[idx]
      ? matchInfo.results[idx].matched_longitude
      : p.longitude;
    const snap = findNearestOnLine(coords, cumDists, rLat, rLng);
    const arrivalSec = Math.round(snap.distance_along_m / AVG_SPEED_MPS);
    return {
      id: p.id,
      stop_id: p.stop_id,
      stop_name: p.stop_name,
      latitude: p.latitude,
      longitude: p.longitude,
      routing_latitude: rLat,
      routing_longitude: rLng,
      stop_type: p.stop_type,
      sequence: idx + 1,
      distance_from_start_m: Math.round(snap.distance_along_m),
      arrival_offset_seconds: arrivalSec,
      departure_offset_seconds: arrivalSec + DWELL_SEC,
    };
  });

  const travelSec = totalDistM / AVG_SPEED_MPS;
  const dwellSec = baseWaypoints.length * DWELL_SEC;

  // ── 6. Validate shape ──
  const shapeCheck = validateShape(routeResult.geometry, baseWaypoints, {
    maxStopDistanceM: 500,
    maxDetourRatio: 4,
  });

  return {
    shape: routeResult.geometry,
    points,
    ordered_stops: stopsOrdered.map((s, i) => ({ ...s, sequence: i + 2 })),
    via_points,
    total_distance_m: Math.round(totalDistM),
    estimated_duration_sec: Math.round(travelSec + dwellSec),
    routing_engine,
    from_cache: routeResult.from_cache || false,
    // Metadata mới
    order_check: orderCheck,
    match_info: matchInfo,
    shape_check: shapeCheck,
  };
}

// ═══════════════════════════════════════════════════════════════
// SAVE — multi-direction
// ═══════════════════════════════════════════════════════════════
export async function saveComposedRoute(payload = {}) {
  const {
    route_id, route_short_name, route_full_name, route_color, agency_id,
    is_active = true, directions = [],
    start_depot_id, end_depot_id, stop_ids = [], via_points = [],
  } = payload;

  if (!route_id || !route_short_name || !route_full_name) {
    const e = new Error("Thiếu thông tin bắt buộc."); e.status = 400; throw e;
  }

  const dirs = directions.length > 0
    ? directions
    : [{ direction_id: 0, start_depot_id, end_depot_id, stop_ids, via_points }];

  for (const d of dirs) {
    if (!d.start_depot_id || !d.end_depot_id) {
      const e = new Error(`Chiều ${d.direction_id === 0 ? 'đi' : 'về'} thiếu depot.`);
      e.status = 400; throw e;
    }
  }

  const existed = await Route.findOne({ where: { route_id: String(route_id).trim() } });
  if (existed) { const e = new Error(`route_id "${route_id}" đã tồn tại.`); e.status = 409; throw e; }

  const previews = [];
  for (const d of dirs) {
    const preview = await previewRoute({ ...d, use_road_matching: true });
    previews.push({ direction: d, preview });
  }

  const transaction = await sequelize.transaction();
  try {
    const now = new Date();
    const route = await Route.create({
      route_id: String(route_id).trim(),
      agency_id: agency_id ?? null,
      route_short_name: String(route_short_name).trim(),
      route_full_name: String(route_full_name).trim(),
      route_color: route_color || null,
      is_active,
      created_at: now,
      updated_at: now,
    }, { transaction });

    const patterns = [];
    for (const { direction, preview } of previews) {
      const dirCode = direction.direction_id === 0 ? 'GO' : 'RET';
      const endName = preview.points[preview.points.length - 1]?.stop_name || '';
      const shapeId = `${route.route_id}_${dirCode}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const pattern = await TripPattern.create({
        pattern_code: `${route.route_id}_${dirCode}`,
        route_id: route.id,
        shape_id: shapeId,
        trip_headsign: `${route.route_short_name} → ${endName}`,
        direction_id: direction.direction_id ?? 0,
      }, { transaction });

      await saveShapePoints(shapeId, preview.shape.coordinates, transaction);
      await saveStopTimePatterns(pattern.id, preview.points, transaction);
      patterns.push(pattern.get({ plain: true }));
    }

    await transaction.commit();
    return { route: route.get({ plain: true }), patterns };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function saveShapePoints(shapeId, coords, transaction) {
  const rows = coords.map((c, i) => ({
    shape_id: shapeId,
    geom: sequelize.fn(
      "ST_SetSRID",
      sequelize.fn("ST_MakePoint", Number(c[0]), Number(c[1])),
      4326
    ),
    shape_pt_sequence: i + 1,
  }));
  const CHUNK = 300;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await Shape.bulkCreate(rows.slice(i, i + CHUNK), { transaction });
  }
}

async function saveStopTimePatterns(patternId, points, transaction) {
  const rows = points
    .filter((p) => p.stop_type !== -1)
    .map((p) => ({
      trip_pattern_id: patternId,
      stop_id: p.id,
      stop_sequence: p.sequence,
      arrival_offset_seconds: p.arrival_offset_seconds,
      departure_offset_seconds: p.departure_offset_seconds,
    }));
  await StopTimePattern.bulkCreate(rows, { transaction });
}

export async function deleteComposedRoute(id) {
  const route = await Route.findByPk(id);
  if (!route) { const e = new Error("Không tìm thấy tuyến."); e.status = 404; throw e; }
  const transaction = await sequelize.transaction();
  try {
    const patterns = await TripPattern.findAll({ where: { route_id: id }, transaction });
    const patternIds = patterns.map((p) => p.id);
    const shapeIds = patterns.map((p) => p.shape_id).filter(Boolean);

    if (patternIds.length > 0) {
      await StopTimePattern.destroy({ where: { trip_pattern_id: { [Op.in]: patternIds } }, transaction });
      await Trip.destroy({ where: { trip_pattern_id: { [Op.in]: patternIds } }, transaction });
      await TripPattern.destroy({ where: { id: { [Op.in]: patternIds } }, transaction });
    }
    if (shapeIds.length > 0) {
      await Shape.destroy({ where: { shape_id: { [Op.in]: shapeIds } }, transaction });
    }
    await route.destroy({ transaction });
    await transaction.commit();
    return { id: Number(id) };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
