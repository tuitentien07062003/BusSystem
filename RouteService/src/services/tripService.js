import { Op } from "sequelize";
import Trip from "../models/tripModel.js";
import TripPattern from "../models/tripPatternModel.js";
import Route from "../models/routeModel.js";

function toPlain(t) {
  if (!t) return null;
  return t.get ? t.get({ plain: true }) : t;
}

export async function getAllTrips({ page = 1, limit = 20, is_active, keyword = "" } = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;
  const where = {};
  if (typeof is_active === "boolean") where.is_active = is_active;
  if (keyword && keyword.trim()) {
    where.trip_id = { [Op.iLike]: `%${keyword.trim()}%` };
  }
  const { count, rows } = await Trip.findAndCountAll({
    where, limit, offset, order: [["id", "ASC"]],
  });
  return { total: count, page, limit, totalPages: Math.ceil(count / limit), data: rows.map(toPlain) };
}

export async function getTripById(id) {
  const t = await Trip.findByPk(id);
  if (!t) { const e = new Error("Không tìm thấy chuyến."); e.status = 404; throw e; }
  return toPlain(t);
}

export async function createTrip(payload = {}) {
  const { trip_id, trip_pattern_id, service_id, start_time, is_active } = payload;
  if (!trip_id || !start_time) {
    const e = new Error("trip_id và start_time là bắt buộc."); e.status = 400; throw e;
  }
  const dup = await Trip.findOne({ where: { trip_id: String(trip_id).trim() } });
  if (dup) { const e = new Error(`trip_id "${trip_id}" đã tồn tại.`); e.status = 409; throw e; }
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
  return toPlain(created);
}

export async function updateTrip(id, payload = {}) {
  const t = await Trip.findByPk(id);
  if (!t) { const e = new Error("Không tìm thấy chuyến."); e.status = 404; throw e; }
  const updates = {};
  ["trip_pattern_id", "service_id", "start_time", "is_active"].forEach((k) => {
    if (payload[k] !== undefined) updates[k] = payload[k];
  });
  if (payload.trip_id !== undefined) {
    const v = String(payload.trip_id).trim();
    if (v !== t.trip_id) {
      const dup = await Trip.findOne({ where: { trip_id: v } });
      if (dup) { const e = new Error(`trip_id "${v}" đã tồn tại.`); e.status = 409; throw e; }
    }
    updates.trip_id = v;
  }
  if (Object.keys(updates).length === 0) {
    const e = new Error("Không có trường nào để cập nhật."); e.status = 400; throw e;
  }
  updates.updated_at = new Date();
  await t.update(updates);
  return getTripById(id);
}

export async function changeTripStatus(id, is_active) {
  if (typeof is_active !== "boolean") {
    const e = new Error("is_active phải là boolean."); e.status = 400; throw e;
  }
  const t = await Trip.findByPk(id);
  if (!t) { const e = new Error("Không tìm thấy chuyến."); e.status = 404; throw e; }
  t.is_active = is_active;
  t.updated_at = new Date();
  await t.save();
  return getTripById(id);
}

// ─── Lấy trips theo route ───
export async function getTripsByRoute(routeId, { page = 1, limit = 20 } = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;
  const patterns = await TripPattern.findAll({ where: { route_id: routeId } });
  const patternIds = patterns.map((p) => p.id);
  if (patternIds.length === 0) {
    return { total: 0, page, limit, totalPages: 0, data: [] };
  }
  const { count, rows } = await Trip.findAndCountAll({
    where: { trip_pattern_id: { [Op.in]: patternIds } },
    limit, offset, order: [["start_time", "ASC"]],
  });
  return { total: count, page, limit, totalPages: Math.ceil(count / limit), data: rows.map(toPlain) };
}
