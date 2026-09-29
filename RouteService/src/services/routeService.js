import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Route from "../models/routeModel.js";
import TripPattern from "../models/tripPatternModel.js";
import Shape from "../models/shapeModel.js";
import StopTimePattern from "../models/stopTimePatternModel.js";
import Stop from "../models/stopModel.js";

function toPlain(r) {
  if (!r) return null;
  return r.get ? r.get({ plain: true }) : r;
}

export async function getAllRoutes({
  page = 1,
  limit = 20,
  is_active,
  keyword = "",
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;
  const where = {};
  if (typeof is_active === "boolean") where.is_active = is_active;
  if (keyword && keyword.trim()) {
    const kw = `%${keyword.trim()}%`;
    where[Op.or] = [
      { route_short_name: { [Op.iLike]: kw } },
      { route_full_name: { [Op.iLike]: kw } },
      { route_id: { [Op.iLike]: kw } },
    ];
  }
  const { count, rows } = await Route.findAndCountAll({
    where,
    limit,
    offset,
    order: [["id", "ASC"]],
  });
  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(toPlain),
  };
}

export async function getRouteById(id) {
  const r = await Route.findByPk(id);
  if (!r) {
    const e = new Error("Không tìm thấy tuyến.");
    e.status = 404;
    throw e;
  }
  return toPlain(r);
}

// ═══════════════════════════════════════════════════════════════
// GET FULL ROUTE — cho hiển thị map khi edit
// ═══════════════════════════════════════════════════════════════
export async function getFullRoute(routeId) {
  const route = await Route.findByPk(routeId);
  if (!route) {
    const e = new Error("Không tìm thấy tuyến.");
    e.status = 404;
    throw e;
  }

  const patterns = await TripPattern.findAll({
    where: { route_id: routeId },
    order: [["direction_id", "ASC"]],
  });

  const result = {
    route: toPlain(route),
    patterns: [],
  };

  for (const p of patterns) {
    // Load shape
    let shape = null;
    if (p.shape_id) {
      const shapeRows = await Shape.findAll({
        where: { shape_id: p.shape_id },
        order: [["shape_pt_sequence", "ASC"]],
        attributes: {
          include: [
            [sequelize.fn("ST_X", sequelize.col("geom")), "longitude"],
            [sequelize.fn("ST_Y", sequelize.col("geom")), "latitude"],
          ],
        },
      });
      if (shapeRows.length > 0) {
        shape = {
          type: "LineString",
          coordinates: shapeRows.map((r) => {
            const o = r.get({ plain: true });
            return [parseFloat(o.longitude), parseFloat(o.latitude)];
          }),
        };
      }
    }

    // Load stop_times
    const stopTimes = await StopTimePattern.findAll({
      where: { trip_pattern_id: p.id },
      order: [["stop_sequence", "ASC"]],
    });

    const stopIds = stopTimes.map((st) => st.stop_id).filter(Boolean);
    let stopsMap = new Map();
    if (stopIds.length > 0) {
      const stopIdStrings = stopIds.map(String);
      const stops = await Stop.findAll({
        where: {
          [Op.or]: [
            { id: { [Op.in]: stopIds } },
            { stop_id: { [Op.in]: stopIdStrings } },
          ],
        },
        attributes: {
          include: [
            [sequelize.fn("ST_X", sequelize.col("geom")), "longitude"],
            [sequelize.fn("ST_Y", sequelize.col("geom")), "latitude"],
          ],
        },
      });

      stopsMap = new Map();
      for (const s of stops) {
        const o = s.get({ plain: true });
        const info = {
          id: o.id,
          stop_id: o.stop_id,
          stop_name: o.stop_name,
          latitude: parseFloat(o.latitude),
          longitude: parseFloat(o.longitude),
          stop_type: o.stop_type,
        };
        stopsMap.set(o.id, info);
        stopsMap.set(String(o.stop_id), info);
      }
    }

    result.patterns.push({
      id: p.id,
      direction_id: p.direction_id,
      trip_headsign: p.trip_headsign,
      pattern_code: p.pattern_code,
      shape_id: p.shape_id,
      shape,
      stops: stopTimes.map((st) => {
        const info =
          stopsMap.get(st.stop_id) || stopsMap.get(String(st.stop_id)) || {};
        return {
          ...info,
          stop_sequence: st.stop_sequence,
          arrival_offset_seconds: st.arrival_offset_seconds,
          departure_offset_seconds: st.departure_offset_seconds,
        };
      }),
    });
  }

  return result;
}

export async function createRoute(payload = {}) {
  const {
    route_id,
    agency_id,
    route_short_name,
    route_full_name,
    route_color,
    is_active,
  } = payload;
  if (!route_id || !route_short_name || !route_full_name) {
    const e = new Error(
      "route_id, route_short_name, route_full_name là bắt buộc.",
    );
    e.status = 400;
    throw e;
  }
  const dup = await Route.findOne({
    where: { route_id: String(route_id).trim() },
  });
  if (dup) {
    const e = new Error(`route_id "${route_id}" đã tồn tại.`);
    e.status = 409;
    throw e;
  }
  const now = new Date();
  const created = await Route.create({
    route_id: String(route_id).trim(),
    agency_id: agency_id ?? null,
    route_short_name: String(route_short_name).trim(),
    route_full_name: String(route_full_name).trim(),
    route_color: route_color || null,
    is_active: is_active !== undefined ? !!is_active : true,
    created_at: now,
    updated_at: now,
  });
  return toPlain(created);
}

export async function updateRoute(id, payload = {}) {
  const r = await Route.findByPk(id);
  if (!r) {
    const e = new Error("Không tìm thấy tuyến.");
    e.status = 404;
    throw e;
  }
  const updates = {};
  [
    "agency_id",
    "route_short_name",
    "route_full_name",
    "route_color",
    "is_active",
  ].forEach((k) => {
    if (payload[k] !== undefined) updates[k] = payload[k];
  });
  if (payload.route_id !== undefined) {
    const v = String(payload.route_id).trim();
    if (v !== r.route_id) {
      const dup = await Route.findOne({ where: { route_id: v } });
      if (dup) {
        const e = new Error(`route_id "${v}" đã tồn tại.`);
        e.status = 409;
        throw e;
      }
    }
    updates.route_id = v;
  }
  if (Object.keys(updates).length === 0) {
    const e = new Error("Không có trường nào để cập nhật.");
    e.status = 400;
    throw e;
  }
  updates.updated_at = new Date();
  await r.update(updates);
  return getRouteById(id);
}

export async function changeRouteStatus(id, is_active) {
  if (typeof is_active !== "boolean") {
    const e = new Error("is_active phải là boolean.");
    e.status = 400;
    throw e;
  }
  const r = await Route.findByPk(id);
  if (!r) {
    const e = new Error("Không tìm thấy tuyến.");
    e.status = 404;
    throw e;
  }
  r.is_active = is_active;
  r.updated_at = new Date();
  await r.save();
  return getRouteById(id);
}

export async function getRouteStats() {
  const [total, active, inactive] = await Promise.all([
    Route.count(),
    Route.count({ where: { is_active: true } }),
    Route.count({ where: { is_active: false } }),
  ]);
  return { total, active, inactive };
}
