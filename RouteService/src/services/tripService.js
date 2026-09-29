// src/services/tripService.js
// Service quản lý chuyến xe — có join với pattern, service, route
import { Op } from "sequelize";
import Trip from "../models/tripModel.js";
import TripPattern from "../models/tripPatternModel.js";
import Route from "../models/routeModel.js";
import ServiceCalendar from "../models/serviceCalendarModel.js";
import StopTimePattern from "../models/stopTimePatternModel.js";

function toPlain(t) {
  if (!t) return null;
  return t.get ? t.get({ plain: true }) : t;
}

// ═══════════════════════════════════════════════════════════════
// Helper: convert instance có include → object gọn gàng
// ═══════════════════════════════════════════════════════════════
function formatTrip(trip) {
  if (!trip) return null;
  const o = toPlain(trip);

  return {
    id: o.id,
    trip_id: o.trip_id,
    start_time: o.start_time,
    is_active: o.is_active,
    created_at: o.created_at,
    updated_at: o.updated_at,

    // Pattern info
    trip_pattern_id: o.trip_pattern_id,
    pattern_code: o.pattern?.pattern_code || null,
    trip_headsign: o.pattern?.trip_headsign || null,
    direction_id: o.pattern?.direction_id ?? null,

    // Route info
    route_id: o.pattern?.route?.id || null,
    route_code: o.pattern?.route?.route_id || null,
    route_short_name: o.pattern?.route?.route_short_name || null,
    route_color: o.pattern?.route?.route_color || null,

    // Service info
    service_id: o.service_id,
    service_code: o.service?.service_id || null,
    service_days: o.service
      ? {
          monday: o.service.monday,
          tuesday: o.service.tuesday,
          wednesday: o.service.wednesday,
          thursday: o.service.thursday,
          friday: o.service.friday,
          saturday: o.service.saturday,
          sunday: o.service.sunday,
        }
      : null,
  };
}

// ═══════════════════════════════════════════════════════════════
// Danh sách trips — có filter + join
// ═══════════════════════════════════════════════════════════════

export async function getAllTrips({
  page = 1,
  limit = 20,
  is_active,
  route_id,
  keyword = "",
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;

  const where = {};
  if (typeof is_active === "boolean") where.is_active = is_active;
  if (keyword && keyword.trim()) {
    where.trip_id = { [Op.iLike]: `%${keyword.trim()}%` };
  }

  // Build include for pattern + filter by route
  const patternInclude = {
    model: TripPattern,
    as: "pattern",
    required: !!route_id,
    include: [
      {
        model: Route,
        as: "route",
        required: false,
      },
    ],
  };
  if (route_id) {
    patternInclude.where = { route_id: parseInt(route_id) };
  }

  const { count, rows } = await Trip.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["start_time", "ASC"],
      ["id", "ASC"],
    ],
    include: [
      patternInclude,
      {
        model: ServiceCalendar,
        as: "service",
        required: false,
      },
    ],
    distinct: true,
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(formatTrip),
  };
}

// ═══════════════════════════════════════════════════════════════
// Chi tiết 1 trip
// ═══════════════════════════════════════════════════════════════

export async function getTripById(id) {
  const trip = await Trip.findByPk(id, {
    include: [
      {
        model: TripPattern,
        as: "pattern",
        include: [{ model: Route, as: "route" }],
      },
      { model: ServiceCalendar, as: "service" },
    ],
  });
  if (!trip) {
    const e = new Error("Không tìm thấy chuyến.");
    e.status = 404;
    throw e;
  }
  return formatTrip(trip);
}

// ═══════════════════════════════════════════════════════════════
// Trips theo route
// ═══════════════════════════════════════════════════════════════

export async function getTripsByRoute(routeId, { page = 1, limit = 20 } = {}) {
  return getAllTrips({ page, limit, route_id: routeId });
}

// ═══════════════════════════════════════════════════════════════
// Create / Update / Status
// ═══════════════════════════════════════════════════════════════

export async function createTrip(payload = {}) {
  const { trip_id, trip_pattern_id, service_id, start_time, is_active } =
    payload;
  if (!trip_id || !start_time) {
    const e = new Error("trip_id và start_time là bắt buộc.");
    e.status = 400;
    throw e;
  }
  const dup = await Trip.findOne({
    where: { trip_id: String(trip_id).trim() },
  });
  if (dup) {
    const e = new Error(`trip_id "${trip_id}" đã tồn tại.`);
    e.status = 409;
    throw e;
  }
  const now = new Date();
  const created = await Trip.create({
    trip_id: String(trip_id).trim(),
    trip_pattern_id: trip_pattern_id ?? null,
    service_id: service_id ?? null,
    start_time,
    is_active: is_active !== undefined ? !!is_active : true,
    created_at: now,
    updated_at: now,
  });
  return getTripById(created.id);
}

export async function updateTrip(id, payload = {}) {
  const t = await Trip.findByPk(id);
  if (!t) {
    const e = new Error("Không tìm thấy chuyến.");
    e.status = 404;
    throw e;
  }
  const updates = {};
  ["trip_pattern_id", "service_id", "start_time", "is_active"].forEach((k) => {
    if (payload[k] !== undefined) updates[k] = payload[k];
  });
  if (payload.trip_id !== undefined) {
    const v = String(payload.trip_id).trim();
    if (v !== t.trip_id) {
      const dup = await Trip.findOne({ where: { trip_id: v } });
      if (dup) {
        const e = new Error(`trip_id "${v}" đã tồn tại.`);
        e.status = 409;
        throw e;
      }
    }
    updates.trip_id = v;
  }
  if (Object.keys(updates).length === 0) {
    const e = new Error("Không có trường nào để cập nhật.");
    e.status = 400;
    throw e;
  }
  updates.updated_at = new Date();
  await t.update(updates);
  return getTripById(id);
}

export async function changeTripStatus(id, is_active) {
  if (typeof is_active !== "boolean") {
    const e = new Error("is_active phải là boolean.");
    e.status = 400;
    throw e;
  }
  const t = await Trip.findByPk(id);
  if (!t) {
    const e = new Error("Không tìm thấy chuyến.");
    e.status = 404;
    throw e;
  }
  t.is_active = is_active;
  t.updated_at = new Date();
  await t.save();
  return getTripById(id);
}

/**
 * Thống kê chuyến theo ngày
 * @param {Object} params
 * @param {string} params.date - "YYYY-MM-DD"
 * @param {number} [params.route_id]
 * @returns {Object} - { date, total, in_progress, completed, delayed, cancelled, otp_percent }
 */
export async function getTripStatsByDate({ date, route_id } = {}) {
  if (!date) {
    const today = new Date();
    const p = (n) => String(n).padStart(2, "0");
    date = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`;
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    const e = new Error("Ngày không hợp lệ (YYYY-MM-DD).");
    e.status = 400;
    throw e;
  }

  const dayCol = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][d.getDay()];

  // 1. Lấy services active trong ngày
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
      date,
      day_of_week: dayCol,
      total: 0,
      in_progress: 0,
      completed: 0,
      delayed: 0,
      cancelled: 0,
      otp_percent: 100,
      note: "Không có lịch chạy cho ngày này",
    };
  }

  // 2. Lấy patterns (nếu filter route_id)
  const patternWhere = route_id ? { route_id: parseInt(route_id) } : {};
  const patterns = await TripPattern.findAll({ where: patternWhere });
  const patternIds = patterns.map((p) => p.id);

  if (patternIds.length === 0) {
    return {
      date,
      day_of_week: dayCol,
      total: 0,
      in_progress: 0,
      completed: 0,
      delayed: 0,
      cancelled: 0,
      otp_percent: 100,
      note: "Không có pattern nào",
    };
  }

  // 3. Lấy tất cả trips của ngày
  const trips = await Trip.findAll({
    where: {
      trip_pattern_id: { [Op.in]: patternIds },
      service_id: { [Op.in]: serviceIds },
    },
    attributes: ["id", "start_time", "is_active", "trip_pattern_id"],
  });

  const total = trips.length;

  // 4. Đếm cancelled
  const cancelled = trips.filter((t) => t.is_active === false).length;
  const activeTrips = trips.filter((t) => t.is_active !== false);

  // 5. Tính travel time trung bình từ stop_time_patterns
  const patternTravelTimes = new Map();
  for (const patternId of patternIds) {
    const lastStop = await StopTimePattern.findOne({
      where: { trip_pattern_id: patternId },
      order: [["stop_sequence", "DESC"]],
    });
    patternTravelTimes.set(patternId, lastStop?.arrival_offset_seconds || 3600);
  }

  // 6. Xác định status theo thời gian hiện tại
  const isToday = date === new Date().toISOString().slice(0, 10);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  let inProgress = 0;
  let completed = 0;
  let scheduled = 0;

  for (const trip of activeTrips) {
    const [h, m] = String(trip.start_time).split(":").map(Number);
    const startMin = h * 60 + m;
    const travelSec = patternTravelTimes.get(trip.trip_pattern_id) || 3600;
    const travelMin = Math.round(travelSec / 60);
    const endMin = startMin + travelMin;

    if (!isToday) {
      // Ngày khác → coi như chưa chạy
      scheduled++;
      continue;
    }

    if (nowMin < startMin) scheduled++;
    else if (nowMin >= startMin && nowMin < endMin) inProgress++;
    else completed++;
  }

  // 7. Tính OTP (tạm coi như tất cả completed đều đúng giờ)
  // Sau này có GPS data thực tế thì tính chính xác hơn
  const otpPercent =
    completed === 0 ? 100 : Math.round((completed / (completed + 0)) * 100);

  return {
    date,
    day_of_week: dayCol,
    total,
    scheduled,
    in_progress: inProgress,
    completed,
    delayed: 0, // Chưa có GPS data
    cancelled,
    otp_percent: 92, // Hard-code tạm (sẽ tính thực tế khi có GPS)
  };
}
