import { Op, fn, col } from "sequelize";
import sequelize from "../config/database.js";
import TripPattern from "../models/tripPatternModel.js";
import Route from "../models/routeModel.js";
import Shape from "../models/shapeModel.js";
import StopTimePattern from "../models/stopTimePatternModel.js";
import Trip from "../models/tripModel.js";

function toPlain(p) {
  if (!p) return null;
  return p.get ? p.get({ plain: true }) : p;
}

// ─── Lấy danh sách, có lọc theo route_id / direction_id ───
export async function getAllPatterns({
  page = 1,
  limit = 20,
  route_id,
  direction_id,
  keyword = "",
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;

  const where = {};
  if (route_id) where.route_id = parseInt(route_id);
  if (direction_id !== undefined && direction_id !== null && direction_id !== "") {
    where.direction_id = parseInt(direction_id);
  }
  if (keyword && keyword.trim()) {
    const kw = `%${keyword.trim()}%`;
    where[Op.or] = [
      { pattern_code: { [Op.iLike]: kw } },
      { trip_headsign: { [Op.iLike]: kw } },
    ];
  }

  const { count, rows } = await TripPattern.findAndCountAll({
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

export async function getPatternById(id) {
  const p = await TripPattern.findByPk(id);
  if (!p) {
    const e = new Error("Không tìm thấy pattern.");
    e.status = 404;
    throw e;
  }
  return toPlain(p);
}

// ─── Lấy pattern kèm shape + stops + trips + route ───
export async function getPatternDetail(id) {
  const pattern = await TripPattern.findByPk(id);
  if (!pattern) {
    const e = new Error("Không tìm thấy pattern.");
    e.status = 404;
    throw e;
  }

  // Route
  let route = null;
  if (pattern.route_id) {
    const r = await Route.findByPk(pattern.route_id);
    route = r ? r.get({ plain: true }) : null;
  }

  // Shape
  let shape = null;
  if (pattern.shape_id) {
    const shapeRows = await Shape.findAll({
      where: { shape_id: pattern.shape_id },
      order: [["shape_pt_sequence", "ASC"]],
      attributes: {
        include: [
          [fn("ST_X", col("geom")), "longitude"],
          [fn("ST_Y", col("geom")), "latitude"],
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

  // Trips
  const trips = await Trip.findAll({
    where: { trip_pattern_id: id },
    order: [["start_time", "ASC"]],
  });

  // Stop count
  const stopCount = await StopTimePattern.count({ where: { trip_pattern_id: id } });

  return {
    ...toPlain(pattern),
    route,
    shape,
    trips: trips.map(toPlain),
    stop_count: stopCount,
  };
}

// ─── Tạo pattern ───
export async function createPattern(payload = {}) {
  const { pattern_code, route_id, shape_id, trip_headsign, direction_id } = payload;

  if (!pattern_code) {
    const e = new Error("pattern_code là bắt buộc.");
    e.status = 400;
    throw e;
  }

  const dup = await TripPattern.findOne({
    where: { pattern_code: String(pattern_code).trim() },
  });
  if (dup) {
    const e = new Error(`pattern_code "${pattern_code}" đã tồn tại.`);
    e.status = 409;
    throw e;
  }

  const created = await TripPattern.create({
    pattern_code: String(pattern_code).trim(),
    route_id: route_id ?? null,
    shape_id: shape_id || null,
    trip_headsign: trip_headsign || null,
    direction_id: direction_id ?? null,
  });
  return toPlain(created);
}

// ─── Cập nhật pattern ───
export async function updatePattern(id, payload = {}) {
  const p = await TripPattern.findByPk(id);
  if (!p) {
    const e = new Error("Không tìm thấy pattern.");
    e.status = 404;
    throw e;
  }

  const updates = {};
  ["route_id", "shape_id", "trip_headsign", "direction_id"].forEach((k) => {
    if (payload[k] !== undefined) updates[k] = payload[k];
  });

  if (payload.pattern_code !== undefined) {
    const v = String(payload.pattern_code).trim();
    if (v !== p.pattern_code) {
      const dup = await TripPattern.findOne({ where: { pattern_code: v } });
      if (dup) {
        const e = new Error(`pattern_code "${v}" đã tồn tại.`);
        e.status = 409;
        throw e;
      }
    }
    updates.pattern_code = v;
  }

  if (Object.keys(updates).length === 0) {
    const e = new Error("Không có trường nào để cập nhật.");
    e.status = 400;
    throw e;
  }

  await p.update(updates);
  return getPatternById(id);
}

// ─── Xoá pattern (cascade stop_times + trips + shape) ───
export async function deletePattern(id, { cascade = true } = {}) {
  const p = await TripPattern.findByPk(id);
  if (!p) {
    const e = new Error("Không tìm thấy pattern.");
    e.status = 404;
    throw e;
  }

  const transaction = await sequelize.transaction();
  try {
    if (cascade) {
      // Kiểm tra có trips không
      const tripCount = await Trip.count({
        where: { trip_pattern_id: id },
        transaction,
      });
      if (tripCount > 0 && !cascade) {
        const e = new Error(`Pattern còn ${tripCount} chuyến. Không thể xoá.`);
        e.status = 409;
        throw e;
      }

      // Xoá stop_time_patterns
      await StopTimePattern.destroy({
        where: { trip_pattern_id: id },
        transaction,
      });

      // Xoá trips
      await Trip.destroy({
        where: { trip_pattern_id: id },
        transaction,
      });

      // Xoá shape (nếu có shape_id)
      if (p.shape_id) {
        await Shape.destroy({
          where: { shape_id: p.shape_id },
          transaction,
        });
      }
    }

    await p.destroy({ transaction });
    await transaction.commit();
    return { id: Number(id) };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ─── Stats ───
export async function getPatternStats() {
  const [total, goCount, returnCount] = await Promise.all([
    TripPattern.count(),
    TripPattern.count({ where: { direction_id: 0 } }),
    TripPattern.count({ where: { direction_id: 1 } }),
  ]);
  return { total, go: goCount, return: returnCount };
}

// ─── Lấy pattern theo route ───
export async function getPatternsByRoute(routeId) {
  const rows = await TripPattern.findAll({
    where: { route_id: routeId },
    order: [["direction_id", "ASC"], ["id", "ASC"]],
  });
  return rows.map(toPlain);
}
