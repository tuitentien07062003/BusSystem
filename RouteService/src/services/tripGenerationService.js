import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Route from "../models/routeModel.js";
import RouteOperation from "../models/routeOperationModel.js";
import TripPattern from "../models/tripPatternModel.js";
import Trip from "../models/tripModel.js";
import ServiceCalendar from "../models/serviceCalendarModel.js";
import HeadwayConfig from "../models/headwayConfigModel.js";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Chuyển "HH:MM[:SS]" → số giây
 */
function timeToSec(t) {
  if (!t) return 0;
  const [h, m, s = 0] = String(t).split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

/**
 * Chuyển số giây → "HH:MM:SS"
 */
function secToTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

/**
 * Rút gọn service_id để làm prefix trip_id
 * VD: "WEEKDAY" → "WD", "WEEKEND" → "WE", "HOLIDAY" → "HD"
 */
function serviceCode(serviceId) {
  if (!serviceId) return "XX";
  const upper = String(serviceId).toUpperCase();
  // Lấy 2-3 ký tự đầu
  if (upper.length <= 3) return upper;
  // Nếu có dấu gạch dưới, lấy chữ cái đầu mỗi từ
  if (upper.includes("_") || upper.includes("-")) {
    const parts = upper.split(/[_-]/);
    return parts
      .map((p) => p[0])
      .join("")
      .slice(0, 3);
  }
  return upper.slice(0, 2);
}

// ═══════════════════════════════════════════════════════════════
// CORE — Sinh danh sách trips (không insert)
// ═══════════════════════════════════════════════════════════════

/**
 * @param {Object} params
 * @param {Object} params.route
 * @param {Object} params.operations - route_operations row
 * @param {Array}  params.patterns - trip_patterns rows
 * @param {Array}  params.services - service_calendars rows
 * @param {number} params.headwaySeconds
 * @returns {Array<Object>} - danh sách trips (chưa có id)
 */
// ═══════════════════════════════════════════════════════════════
// CORE — Sinh danh sách trips dựa trên headway configs
// ═══════════════════════════════════════════════════════════════

/**
 * Sinh danh sách trips dựa trên:
 *  - Route + Patterns
 *  - Headway configs (theo từng khung giờ)
 *  - Service multiplier (nhân vào headway)
 *
 * Logic:
 *  Với mỗi (service, pattern):
 *    Với mỗi config khung giờ:
 *      final_headway = config.headway_seconds × service.headway_multiplier
 *      Sinh trips từ config.from_time đến config.to_time
 *
 * @param {Object} params
 * @param {Object} params.route
 * @param {Object} params.operations
 * @param {Array}  params.patterns
 * @param {Array}  params.services       - service_calendars rows (đã có headway_multiplier)
 * @param {Array}  params.headwayConfigs - headway_configs rows
 * @param {number} params.defaultHeadwaySeconds - fallback nếu không có configs
 * @returns {Array<Object>} - danh sách trips
 */
function buildTripList({
  route,
  operations,
  patterns,
  services,
  headwayConfigs = [],
  defaultHeadwaySeconds = 900,
}) {
  const trips = [];

  let configsToUse = headwayConfigs;

  if (!configsToUse || configsToUse.length === 0) {
    const startTime = operations.operating_start_time || "05:00";
    const endTime = operations.operating_end_time || "22:00";
    configsToUse = [
      {
        from_time: startTime,
        to_time: endTime,
        headway_seconds: defaultHeadwaySeconds,
        label: "Khung giờ mặc định",
      },
    ];
    console.log(
      `[tripGen] Route ${route.route_id}: không có headway configs, dùng default ${defaultHeadwaySeconds}s`,
    );
  }

  const sortedConfigs = [...configsToUse].sort(
    (a, b) => timeToSec(a.from_time) - timeToSec(b.from_time),
  );

  for (const service of services) {
    const svcCode = serviceCode(service.service_id);

    const multiplier = parseFloat(service.headway_multiplier) || 1.0;

    for (const pattern of patterns) {
      const dirCode = pattern.direction_id === 0 ? "GO" : "RET";

      let sequence = 1;

      for (const config of sortedConfigs) {
        const baseHeadway = parseInt(config.headway_seconds);
        if (isNaN(baseHeadway) || baseHeadway < 60) {
          console.warn(
            `[tripGen] Config ${config.from_time}–${config.to_time} có headway không hợp lệ, skip.`,
          );
          continue;
        }

        // Áp dụng multiplier
        const finalHeadway = Math.max(60, Math.round(baseHeadway * multiplier));

        const startSec = timeToSec(config.from_time);
        const endSec = timeToSec(config.to_time);

        if (endSec <= startSec) {
          console.warn(
            `[tripGen] Config ${config.from_time}–${config.to_time} không hợp lệ (start >= end), skip.`,
          );
          continue;
        }

        let current = startSec;

        // Sinh trips trong khung giờ này
        while (current < endSec) {
          const tripId = `${route.route_id}_${dirCode}_${svcCode}_${String(
            sequence,
          ).padStart(3, "0")}`;

          trips.push({
            trip_id: tripId,
            trip_pattern_id: pattern.id,
            service_id: service.id,
            start_time: secToTime(current),
            is_active: true,
          });

          current += finalHeadway;
          sequence++;
        }
      }
    }
  }

  return trips;
}

// ═══════════════════════════════════════════════════════════════
// PREVIEW — Xem trước, không insert
// ═══════════════════════════════════════════════════════════════

/**
 * Xem trước danh sách trips sẽ được sinh
 *
 * @param {number} routeId
 * @param {Object} payload - { service_ids: [], headway_seconds? }
 */
export async function previewTrips(routeId, payload = {}) {
  const ctx = await prepareContext(routeId, payload);

  const trips = buildTripList({
    route: ctx.route,
    operations: ctx.operations,
    patterns: ctx.patterns,
    services: ctx.services,
    headwayConfigs: ctx.headwayConfigs,
    defaultHeadwaySeconds: ctx.defaultHeadwaySeconds,
  });

  return {
    route_id: routeId,
    has_headway_configs: ctx.headwayConfigs.length > 0,
    headway_configs_count: ctx.headwayConfigs.length,
    services: ctx.services.map((s) => ({
      id: s.id,
      service_id: s.service_id,
      headway_multiplier: parseFloat(s.headway_multiplier) || 1.0,
    })),
    total_count: trips.length,
    counts_by_direction: {
      go: trips.filter((t) => t.trip_id.includes("_GO_")).length,
      return: trips.filter((t) => t.trip_id.includes("_RET_")).length,
    },
    first_trip_time: trips[0]?.start_time || null,
    last_trip_time: trips[trips.length - 1]?.start_time || null,
    sample: trips.slice(0, 10),
  };
}

// ═══════════════════════════════════════════════════════════════
// GENERATE — Sinh + insert vào DB
// ═══════════════════════════════════════════════════════════════

/**
 * Sinh trips và insert vào DB
 *
 * @param {number} routeId
 * @param {Object} payload
 * @param {Array}  payload.service_ids - bắt buộc
 * @param {number} payload.headway_seconds - optional, default lấy từ ops.min_headway_seconds
 * @param {string} payload.mode - 'reset' (default) | 'additive'
 *   - reset: xóa hết trips cũ của route, sinh mới hoàn toàn
 *   - additive: giữ trips cũ, chỉ thêm trips mới (skip trùng)
 */
export async function generateTrips(routeId, payload = {}) {
  const ctx = await prepareContext(routeId, payload);

  const trips = buildTripList({
    route: ctx.route,
    operations: ctx.operations,
    patterns: ctx.patterns,
    services: ctx.services,
    headwayConfigs: ctx.headwayConfigs,
    defaultHeadwaySeconds: ctx.defaultHeadwaySeconds,
  });

  const mode = payload.mode || "reset";
  const patternIds = ctx.patterns.map((p) => p.id);

  const transaction = await sequelize.transaction();
  try {
    if (mode === "reset") {
      await Trip.destroy({
        where: { trip_pattern_id: { [Op.in]: patternIds } },
        transaction,
      });
    }

    const created = await Trip.bulkCreate(trips, {
      ignoreDuplicates: true,
      transaction,
    });

    await transaction.commit();

    return {
      route_id: routeId,
      mode,
      inserted: created.length,
      total_generated: trips.length,
      skipped: trips.length - created.length,
      has_headway_configs: ctx.headwayConfigs.length > 0,
      first_trip_time: trips[0]?.start_time || null,
      last_trip_time: trips[trips.length - 1]?.start_time || null,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════
// REGENERATE — Sinh lại (dùng khi metadata thay đổi)
// ═══════════════════════════════════════════════════════════════

export async function regenerateTrips(routeId, payload = {}) {
  return generateTrips(routeId, {
    ...payload,
    mode: payload.mode || "reset",
  });
}

// ═══════════════════════════════════════════════════════════════
// PREPARE CONTEXT — Load và validate dữ liệu
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// PREPARE CONTEXT — Load và validate dữ liệu
// ═══════════════════════════════════════════════════════════════

async function prepareContext(routeId, payload) {
  const route = await Route.findByPk(routeId);
  if (!route) {
    const e = new Error("Không tìm thấy tuyến.");
    e.status = 404;
    throw e;
  }

  const operations = await RouteOperation.findByPk(routeId);
  if (!operations) {
    const e = new Error(
      "Tuyến chưa được kích hoạt. Vui lòng kích hoạt trước khi sinh chuyến.",
    );
    e.status = 400;
    throw e;
  }

  const patterns = await TripPattern.findAll({
    where: { route_id: routeId },
    order: [["direction_id", "ASC"]],
  });
  if (patterns.length === 0) {
    const e = new Error("Tuyến chưa có pattern (chiều đi/về).");
    e.status = 400;
    throw e;
  }

  const serviceIds = payload.service_ids;
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    const e = new Error("service_ids là bắt buộc và phải là mảng không rỗng.");
    e.status = 400;
    throw e;
  }

  const services = await ServiceCalendar.findAll({
    where: { id: { [Op.in]: serviceIds } },
    order: [["id", "ASC"]],
  });

  if (services.length === 0) {
    const e = new Error("Không tìm thấy service_calendars nào.");
    e.status = 404;
    throw e;
  }

  if (services.length !== serviceIds.length) {
    const foundIds = services.map((s) => s.id);
    const missing = serviceIds.filter((id) => !foundIds.includes(id));
    console.warn(
      `[generateTrips] Một số service_id không tồn tại: ${missing.join(", ")}`,
    );
  }

  const headwayConfigs = await HeadwayConfig.findAll({
    where: { route_id: routeId },
    order: [["from_time", "ASC"]],
  });

  let defaultHeadwaySeconds = operations.min_headway_seconds || 900;

  if (payload.headway_seconds) {
    const h = parseInt(payload.headway_seconds);
    if (!isNaN(h) && h >= 60) {
      defaultHeadwaySeconds = h;
    }
  }

  return {
    route,
    operations,
    patterns,
    services,
    headwayConfigs: headwayConfigs.map((c) =>
      c.get ? c.get({ plain: true }) : c,
    ),
    defaultHeadwaySeconds,
  };
}
