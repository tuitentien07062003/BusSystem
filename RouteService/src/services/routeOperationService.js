import { Op } from "sequelize";
import sequelize from "../config/database.js";
import RouteOperation from "../models/routeOperationModel.js";
import RouteStatsCache from "../models/routeStatsCacheModel.js";
import Route from "../models/routeModel.js";
import TripPattern from "../models/tripPatternModel.js";
import Trip from "../models/tripModel.js";
import { computeRouteStats, getCachedStats } from "./routeStatsService.js";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Chuyển "HH:MM" hoặc "HH:MM:SS" → "HH:MM:SS"
 */
function normalizeTime(t) {
  if (!t) return null;
  const parts = String(t).split(":");
  const h = String(parts[0] || "0").padStart(2, "0");
  const m = String(parts[1] || "0").padStart(2, "0");
  const s = String(parts[2] || "0").padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Validate payload metadata vận hành
 */
function validatePayload(payload = {}) {
  const errors = [];

  // Giờ hoạt động
  if (payload.operating_start_time !== undefined) {
    const t = String(payload.operating_start_time);
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
      errors.push("operating_start_time không đúng định dạng HH:MM.");
    }
  }
  if (payload.operating_end_time !== undefined) {
    const t = String(payload.operating_end_time);
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
      errors.push("operating_end_time không đúng định dạng HH:MM.");
    }
  }

  // So sánh start < end
  if (
    payload.operating_start_time !== undefined &&
    payload.operating_end_time !== undefined
  ) {
    const start = normalizeTime(payload.operating_start_time);
    const end = normalizeTime(payload.operating_end_time);
    if (start && end && start >= end) {
      errors.push("operating_start_time phải nhỏ hơn operating_end_time.");
    }
  }

  // Giá vé
  if (payload.base_fare !== undefined) {
    const v = parseInt(payload.base_fare);
    if (isNaN(v) || v < 0) {
      errors.push("base_fare phải là số nguyên >= 0.");
    }
  }

  // Headway
  if (payload.min_headway_seconds !== undefined) {
    const v = parseInt(payload.min_headway_seconds);
    if (isNaN(v) || v < 60) {
      errors.push("min_headway_seconds phải >= 60 giây.");
    }
  }
  if (payload.max_headway_seconds !== undefined) {
    const v = parseInt(payload.max_headway_seconds);
    if (isNaN(v) || v < 60) {
      errors.push("max_headway_seconds phải >= 60 giây.");
    }
  }

  // So sánh min < max
  if (
    payload.min_headway_seconds !== undefined &&
    payload.max_headway_seconds !== undefined
  ) {
    const min = parseInt(payload.min_headway_seconds);
    const max = parseInt(payload.max_headway_seconds);
    if (!isNaN(min) && !isNaN(max) && min > max) {
      errors.push("min_headway_seconds phải <= max_headway_seconds.");
    }
  }

  return errors;
}

/**
 * Chuyển instance → plain object
 */
function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVATE — Kích hoạt tuyến
// ═══════════════════════════════════════════════════════════════

export async function activateRoute(routeId, payload = {}) {
  // 1. Validate
  const errors = validatePayload(payload);
  if (errors.length > 0) {
    const e = new Error(errors.join(" "));
    e.status = 400;
    throw e;
  }

  // 2. Kiểm tra route tồn tại
  const route = await Route.findByPk(routeId);
  if (!route) {
    const e = new Error("Không tìm thấy tuyến.");
    e.status = 404;
    throw e;
  }

  // 3. Kiểm tra patterns tồn tại
  const patterns = await TripPattern.findAll({
    where: { route_id: routeId },
  });
  if (patterns.length === 0) {
    const e = new Error(
      "Tuyến chưa có pattern (chiều đi/về). Vui lòng tạo lộ trình trước.",
    );
    e.status = 400;
    throw e;
  }

  // 4. Chuẩn bị dữ liệu upsert
  const now = new Date();
  const upsertData = {
    route_id: routeId,
    description:
      payload.description !== undefined ? payload.description : undefined,
    operating_start_time: payload.operating_start_time
      ? normalizeTime(payload.operating_start_time)
      : undefined,
    operating_end_time: payload.operating_end_time
      ? normalizeTime(payload.operating_end_time)
      : undefined,
    base_fare:
      payload.base_fare !== undefined ? parseInt(payload.base_fare) : undefined,
    min_headway_seconds:
      payload.min_headway_seconds !== undefined
        ? parseInt(payload.min_headway_seconds)
        : undefined,
    max_headway_seconds:
      payload.max_headway_seconds !== undefined
        ? parseInt(payload.max_headway_seconds)
        : undefined,
    activated_at: now,
    updated_at: now,
  };

  // Loại bỏ các field undefined để Sequelize dùng default khi insert mới
  Object.keys(upsertData).forEach((k) => {
    if (upsertData[k] === undefined) delete upsertData[k];
  });

  // 5. Transaction: upsert ops + set is_active
  const transaction = await sequelize.transaction();
  try {
    // 5.1. Upsert route_operations
    await RouteOperation.upsert(upsertData, { transaction });

    // 5.2. Set route.is_active = true
    await route.update({ is_active: true, updated_at: now }, { transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  // 6. Compute stats (ngoài transaction vì có thể chậm)
  try {
    await computeRouteStats(routeId);
  } catch (err) {
    // Không rollback toàn bộ — route vẫn active, chỉ warning
    console.error("[activateRoute] Compute stats failed:", err.message);
  }

  // 7. Đếm trips hiện có để trả warning
  const tripCount = await Trip.count({
    where: {
      trip_pattern_id: { [Op.in]: patterns.map((p) => p.id) },
      is_active: true,
    },
  });

  // 8. Trả kết quả
  const operations = await RouteOperation.findByPk(routeId);
  const stats = await getCachedStats(routeId);

  return {
    route_id: routeId,
    is_operating: true,
    operations: toPlain(operations),
    stats: toPlain(stats),
    trip_count: tripCount,
    warning:
      tripCount === 0
        ? "Tuyến đã kích hoạt nhưng chưa có chuyến nào. Vui lòng sinh chuyến."
        : null,
  };
}

// ═══════════════════════════════════════════════════════════════
// DEACTIVATE — Hủy kích hoạt
// ═══════════════════════════════════════════════════════════════

/**
 * Hủy kích hoạt tuyến:
 *  - Xóa row trong route_operations
 *  - Set route.is_active = false
 *  - Giữ nguyên trips (không xóa)
 *  - Giữ nguyên route_stats_cache (để kích hoạt lại nhanh)
 */
export async function deactivateRoute(routeId) {
  const route = await Route.findByPk(routeId);
  if (!route) {
    const e = new Error("Không tìm thấy tuyến.");
    e.status = 404;
    throw e;
  }

  const transaction = await sequelize.transaction();
  try {
    // Xóa operations
    await RouteOperation.destroy({
      where: { route_id: routeId },
      transaction,
    });

    // Set route inactive
    await route.update(
      { is_active: false, updated_at: new Date() },
      { transaction },
    );

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  return {
    route_id: routeId,
    is_operating: false,
    message: "Đã hủy kích hoạt tuyến. Trips vẫn được giữ lại.",
  };
}

// ═══════════════════════════════════════════════════════════════
// GET — Lấy thông tin vận hành
// ═══════════════════════════════════════════════════════════════

/**
 * Lấy metadata vận hành + stats cache của tuyến
 */
export async function getRouteOperations(routeId) {
  const route = await Route.findByPk(routeId);
  if (!route) {
    const e = new Error("Không tìm thấy tuyến.");
    e.status = 404;
    throw e;
  }

  const [operations, stats, patterns] = await Promise.all([
    RouteOperation.findByPk(routeId),
    getCachedStats(routeId),
    TripPattern.findAll({ where: { route_id: routeId } }),
  ]);

  // Đếm trips đang active của route
  let tripCount = 0;
  if (patterns.length > 0) {
    tripCount = await Trip.count({
      where: {
        trip_pattern_id: { [Op.in]: patterns.map((p) => p.id) },
        is_active: true,
      },
    });
  }

  return {
    route_id: routeId,
    is_operating: !!operations,
    is_active: route.is_active,
    operations: toPlain(operations),
    stats: toPlain(stats),
    trip_count: tripCount,
  };
}

// ═══════════════════════════════════════════════════════════════
// UPDATE — Sửa metadata
// ═══════════════════════════════════════════════════════════════

/**
 * Cập nhật metadata vận hành
 * Chỉ cho phép sửa khi tuyến đã được kích hoạt (đã có row ops)
 */
export async function updateRouteOperations(routeId, payload = {}) {
  // 1. Validate
  const errors = validatePayload(payload);
  if (errors.length > 0) {
    const e = new Error(errors.join(" "));
    e.status = 400;
    throw e;
  }

  // 2. Kiểm tra tồn tại
  const operations = await RouteOperation.findByPk(routeId);
  if (!operations) {
    const e = new Error("Tuyến chưa được kích hoạt.");
    e.status = 404;
    throw e;
  }

  // 3. Chuẩn bị updates
  const updates = { updated_at: new Date() };

  if (payload.description !== undefined) {
    updates.description = payload.description;
  }
  if (payload.operating_start_time !== undefined) {
    updates.operating_start_time = normalizeTime(payload.operating_start_time);
  }
  if (payload.operating_end_time !== undefined) {
    updates.operating_end_time = normalizeTime(payload.operating_end_time);
  }
  if (payload.base_fare !== undefined) {
    updates.base_fare = parseInt(payload.base_fare);
  }
  if (payload.min_headway_seconds !== undefined) {
    updates.min_headway_seconds = parseInt(payload.min_headway_seconds);
  }
  if (payload.max_headway_seconds !== undefined) {
    updates.max_headway_seconds = parseInt(payload.max_headway_seconds);
  }

  // 4. Update
  await operations.update(updates);

  // 5. Trả kết quả
  return {
    route_id: routeId,
    operations: toPlain(operations),
  };
}
