import { Op, QueryTypes } from "sequelize";
import sequelize from "../config/database.js";
import RouteStatsCache from "../models/routeStatsCacheModel.js";
import Route from "../models/routeModel.js";
import TripPattern from "../models/tripPatternModel.js";
import StopTimePattern from "../models/stopTimePatternModel.js";
import Trip from "../models/tripModel.js";
import ServiceCalendar from "../models/serviceCalendarModel.js";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Chuyển "HH:MM:SS" → số giây
 */
function timeToSec(t) {
  if (!t) return 0;
  const [h, m, s = 0] = String(t).split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

/**
 * Chuyển số giây → "HH:MM" (bỏ giây)
 */
function secToTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}`;
}

/**
 * Tính giãn cách giữa các trips liên tiếp (theo start_time)
 * @param {Array} trips - danh sách trips đã sort theo start_time
 * @returns {Object} - { avg_min, min_min, max_min, count, details }
 */
function computeHeadways(trips) {
  if (!trips || trips.length < 2) {
    return {
      avg_min: 0,
      min_min: 0,
      max_min: 0,
      count: trips?.length || 0,
      details: [],
    };
  }

  const details = [];
  const gaps = [];

  for (let i = 1; i < trips.length; i++) {
    const prevSec = timeToSec(trips[i - 1].start_time);
    const curSec = timeToSec(trips[i].start_time);
    const gapMin = (curSec - prevSec) / 60;
    gaps.push(gapMin);
    details.push({
      from: secToTime(prevSec),
      to: secToTime(curSec),
      gap_min: Math.round(gapMin * 10) / 10,
    });
  }

  const sum = gaps.reduce((a, b) => a + b, 0);

  return {
    avg_min: Math.round((sum / gaps.length) * 10) / 10,
    min_min: Math.round(Math.min(...gaps) * 10) / 10,
    max_min: Math.round(Math.max(...gaps) * 10) / 10,
    count: trips.length,
    details,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPUTE STATS — tính + cache độ dài & travel time
// ═══════════════════════════════════════════════════════════════

/**
 * Tính toán và cache số liệu tĩnh của tuyến
 * Gọi khi: kích hoạt tuyến, sửa lộ trình, hoặc admin nhấn "Tính lại"
 *
 * @param {number} routeId
 * @returns {Promise<RouteStatsCache>}
 */
export async function computeRouteStats(routeId) {
  // 1. Kiểm tra route tồn tại
  const route = await Route.findByPk(routeId);
  if (!route) {
    const e = new Error("Không tìm thấy tuyến.");
    e.status = 404;
    throw e;
  }

  // 2. Lấy tất cả patterns của route
  const patterns = await TripPattern.findAll({
    where: { route_id: routeId },
    order: [["direction_id", "ASC"]],
  });

  if (patterns.length === 0) {
    const e = new Error("Tuyến chưa có pattern (chiều đi/về).");
    e.status = 400;
    throw e;
  }

  // 3. Khởi tạo giá trị mặc định
  let goLength = 0;
  let retLength = 0;
  let goTime = 0;
  let retTime = 0;

  // 4. Duyệt từng pattern để tính
  for (const pattern of patterns) {
    // ── Tính travel time: lấy arrival của stop cuối cùng ──
    const lastStop = await StopTimePattern.findOne({
      where: { trip_pattern_id: pattern.id },
      order: [["stop_sequence", "DESC"]],
    });
    const travelTime = lastStop?.arrival_offset_seconds || 0;

    // ── Tính length: ST_Length của shape ──
    let lengthM = 0;
    if (pattern.shape_id) {
      const rows = await sequelize.query(
        `SELECT
           COALESCE(
             ST_Length(
               ST_MakeLine(geom ORDER BY shape_pt_sequence)::geography
             ),
             0
           ) AS length_m
         FROM shapes
         WHERE shape_id = :shapeId`,
        {
          replacements: { shapeId: pattern.shape_id },
          type: QueryTypes.SELECT,
        },
      );
      lengthM = rows[0]?.length_m
        ? Math.round(parseFloat(rows[0].length_m))
        : 0;
    }

    // ── Gán vào đúng chiều ──
    if (pattern.direction_id === 0) {
      goLength = lengthM;
      goTime = travelTime;
    } else if (pattern.direction_id === 1) {
      retLength = lengthM;
      retTime = travelTime;
    }
  }

  // 5. Upsert vào cache
  const now = new Date();
  const [cache] = await RouteStatsCache.upsert({
    route_id: routeId,
    go_length_m: goLength,
    return_length_m: retLength,
    go_travel_time_sec: goTime,
    return_travel_time_sec: retTime,
    computed_at: now,
  });

  return cache;
}

/**
 * Lấy stats đã cache (không tính lại)
 */
export async function getCachedStats(routeId) {
  return await RouteStatsCache.findByPk(routeId);
}

// ═══════════════════════════════════════════════════════════════
// GET STATS BY DATE — số chuyến + giãn cách (không cache)
// ═══════════════════════════════════════════════════════════════

/**
 * Lấy số liệu vận hành theo 1 ngày cụ thể
 * Bao gồm: số chuyến, giãn cách, giờ chuyến đầu/cuối
 *
 * @param {number} routeId
 * @param {string} date - "YYYY-MM-DD"
 */
export async function getRouteStatsForDate(routeId, date) {
  // 1. Validate date
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    const e = new Error("Ngày không hợp lệ (định dạng YYYY-MM-DD).");
    e.status = 400;
    throw e;
  }

  // 2. Xác định ngày trong tuần
  const dayCol = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][d.getDay()];

  // 3. Tìm service_calendars đang active trong ngày đó
  const services = await ServiceCalendar.findAll({
    where: {
      [dayCol]: true,
      start_date: { [Op.lte]: date },
      end_date: { [Op.gte]: date },
    },
  });

  const serviceIds = services.map((s) => s.id);

  if (serviceIds.length === 0) {
    return {
      route_id: routeId,
      date,
      day_of_week: dayCol,
      trip_count: { go: 0, return: 0, total: 0 },
      headway: { go: null, return: null },
      operating_window: { first_trip: null, last_trip: null },
      note: "Không có lịch chạy cho ngày này",
    };
  }

  // 4. Lấy patterns chia theo chiều
  const patterns = await TripPattern.findAll({
    where: { route_id: routeId },
  });

  const goPatternIds = patterns
    .filter((p) => p.direction_id === 0)
    .map((p) => p.id);
  const retPatternIds = patterns
    .filter((p) => p.direction_id === 1)
    .map((p) => p.id);

  // 5. Query trips
  const goTrips =
    goPatternIds.length > 0
      ? await Trip.findAll({
          where: {
            trip_pattern_id: { [Op.in]: goPatternIds },
            service_id: { [Op.in]: serviceIds },
            is_active: true,
          },
          order: [["start_time", "ASC"]],
          attributes: ["id", "trip_id", "start_time"],
        })
      : [];

  const retTrips =
    retPatternIds.length > 0
      ? await Trip.findAll({
          where: {
            trip_pattern_id: { [Op.in]: retPatternIds },
            service_id: { [Op.in]: serviceIds },
            is_active: true,
          },
          order: [["start_time", "ASC"]],
          attributes: ["id", "trip_id", "start_time"],
        })
      : [];

  // 6. Gộp để tìm giờ chuyến đầu/cuối
  const allTrips = [...goTrips, ...retTrips].sort((a, b) =>
    a.start_time.localeCompare(b.start_time),
  );

  // 7. Trả kết quả
  return {
    route_id: routeId,
    date,
    day_of_week: dayCol,
    services_active: services.map((s) => s.service_id),
    trip_count: {
      go: goTrips.length,
      return: retTrips.length,
      total: allTrips.length,
    },
    headway: {
      go: computeHeadways(goTrips),
      return: computeHeadways(retTrips),
    },
    operating_window: {
      first_trip: allTrips[0]?.start_time
        ? allTrips[0].start_time.slice(0, 5)
        : null,
      last_trip: allTrips[allTrips.length - 1]?.start_time
        ? allTrips[allTrips.length - 1].start_time.slice(0, 5)
        : null,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// DELETE CACHE — dùng khi xóa tuyến (nếu cần)
// ═══════════════════════════════════════════════════════════════

export async function clearStatsCache(routeId) {
  const deleted = await RouteStatsCache.destroy({
    where: { route_id: routeId },
  });
  return { deleted: deleted > 0 };
}
