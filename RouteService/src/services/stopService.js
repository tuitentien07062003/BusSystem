// src/services/stopService.js
import { Op, fn, col } from "sequelize";
import sequelize from "../config/database.js";
import Stop from "../models/stopModel.js";

// ─── Helper: chuyển đổi instance → object phẳng ───
function toPlain(stop) {
  if (!stop) return null;
  const obj = stop.get ? stop.get({ plain: true }) : stop;
  let latitude = null;
  let longitude = null;
  if (obj.geom && obj.geom.coordinates) {
    longitude = obj.geom.coordinates[0];
    latitude = obj.geom.coordinates[1];
  } else if (obj.longitude !== undefined && obj.latitude !== undefined) {
    longitude = parseFloat(obj.longitude);
    latitude = parseFloat(obj.latitude);
  }
  return {
    id: obj.id,
    stop_id: obj.stop_id,
    stop_name: obj.stop_name,
    stop_type: obj.stop_type,
    is_active: obj.is_active,
    created_at: obj.created_at,
    latitude,
    longitude,
  };
}

// ─── Helper: build search where clause ───
// Mode "unaccent" nếu index có sẵn, "ilike" nếu không.
function buildSearchWhere(keyword, mode = "unaccent") {
  const kw = String(keyword || "").trim();
  if (!kw) return null;

  if (mode === "unaccent") {
    return [
      sequelize.where(
        sequelize.fn("immutable_unaccent", sequelize.col("stop_name")),
        { [Op.iLike]: sequelize.fn("immutable_unaccent", `%${kw}%`) }
      ),
    ];
  }
  return [{ stop_name: { [Op.iLike]: `%${kw}%` } }];
}

// ─── Flag: unaccent có sẵn không? Cache kết quả ───
let _unaccentAvailable = null;
async function checkUnaccent() {
  if (_unaccentAvailable !== null) return _unaccentAvailable;
  try {
    await sequelize.query("SELECT immutable_unaccent('test')");
    _unaccentAvailable = true;
  } catch {
    _unaccentAvailable = false;
    console.warn(
      "[stops] immutable_unaccent chưa có — cần chạy migrations/001_extensions.sql. Fallback sang ILIKE."
    );
  }
  return _unaccentAvailable;
}

// ═══════════════════════════════════════════════════════════════
// GET ALL — phân trang
// ═══════════════════════════════════════════════════════════════
export async function getAllStops({ page = 1, limit = 20, is_active, stop_type } = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;

  const where = {};
  if (typeof is_active === "boolean") where.is_active = is_active;
  if (stop_type !== undefined && stop_type !== null && stop_type !== "") {
    where.stop_type = parseInt(stop_type);
  }

  const { count, rows } = await Stop.findAndCountAll({
    where,
    limit,
    offset,
    order: [["id", "ASC"]],
    attributes: {
      include: [
        [fn("ST_X", col("geom")), "longitude"],
        [fn("ST_Y", col("geom")), "latitude"],
      ],
    },
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(toPlain),
  };
}

// ═══════════════════════════════════════════════════════════════
// SEARCH — ưu tiên unaccent, fallback iLike
// ═══════════════════════════════════════════════════════════════
export async function searchStopsByName(keyword, { page = 1, limit = 20, is_active, stop_type } = {}) {
  if (!keyword || !keyword.trim()) {
    const err = new Error("Từ khóa tìm kiếm không được để trống.");
    err.status = 400;
    throw err;
  }

  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;

  const hasUnaccent = await checkUnaccent();
  const where = {};
  if (typeof is_active === "boolean") where.is_active = is_active;
  if (stop_type !== undefined && stop_type !== null && stop_type !== "") {
    where.stop_type = parseInt(stop_type);
  }

  const searchClauses = buildSearchWhere(
    keyword,
    hasUnaccent ? "unaccent" : "ilike"
  );
  if (searchClauses) where[Op.and] = searchClauses;

  const { count, rows } = await Stop.findAndCountAll({
    where,
    limit,
    offset,
    order: [["stop_name", "ASC"]],
    attributes: {
      include: [
        [fn("ST_X", col("geom")), "longitude"],
        [fn("ST_Y", col("geom")), "latitude"],
      ],
    },
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    keyword: keyword.trim(),
    data: rows.map(toPlain),
  };
}

// ═══════════════════════════════════════════════════════════════
// GET BY ID
// ═══════════════════════════════════════════════════════════════
export async function getStopById(id) {
  const stop = await Stop.findByPk(id, {
    attributes: {
      include: [
        [fn("ST_X", col("geom")), "longitude"],
        [fn("ST_Y", col("geom")), "latitude"],
      ],
    },
  });
  if (!stop) {
    const err = new Error("Không tìm thấy stop.");
    err.status = 404;
    throw err;
  }
  return toPlain(stop);
}

// ═══════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════
export async function updateStop(id, payload = {}) {
  const stop = await Stop.findByPk(id);
  if (!stop) {
    const err = new Error("Không tìm thấy stop.");
    err.status = 404;
    throw err;
  }

  const updates = {};
  if (payload.stop_id !== undefined) updates.stop_id = String(payload.stop_id).trim();
  if (payload.stop_name !== undefined) updates.stop_name = String(payload.stop_name).trim();
  if (payload.stop_type !== undefined) updates.stop_type = payload.stop_type;
  if (payload.is_active !== undefined) updates.is_active = !!payload.is_active;

  if (payload.latitude !== undefined && payload.longitude !== undefined) {
    const lng = parseFloat(payload.longitude);
    const lat = parseFloat(payload.latitude);
    if (Number.isNaN(lng) || Number.isNaN(lat)) {
      const err = new Error("latitude/longitude không hợp lệ.");
      err.status = 400;
      throw err;
    }
    updates.geom = sequelize.fn(
      "ST_SetSRID",
      sequelize.fn("ST_MakePoint", lng, lat),
      4326
    );
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error("Không có trường nào để cập nhật.");
    err.status = 400;
    throw err;
  }

  await stop.update(updates);
  return await getStopById(id);
}

// ═══════════════════════════════════════════════════════════════
// CHANGE STATUS
// ═══════════════════════════════════════════════════════════════
export async function changeStopStatus(id, is_active) {
  if (typeof is_active !== "boolean") {
    const err = new Error("is_active phải là kiểu boolean.");
    err.status = 400;
    throw err;
  }
  const stop = await Stop.findByPk(id);
  if (!stop) {
    const err = new Error("Không tìm thấy stop.");
    err.status = 404;
    throw err;
  }
  stop.is_active = is_active;
  await stop.save();
  return await getStopById(id);
}

// ═══════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════
export async function getStopStats() {
  const [total, active, inactive] = await Promise.all([
    Stop.count(),
    Stop.count({ where: { is_active: true } }),
    Stop.count({ where: { is_active: false } }),
  ]);
  return { total, active, inactive };
}
