import { Op } from "sequelize";
import sequelize from "../config/database.js";
import HeadwayConfig from "../models/headwayConfigModel.js";
import Route from "../models/routeModel.js";
import RouteOperation from "../models/routeOperationModel.js";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function timeToSec(t) {
  if (!t) return 0;
  const [h, m, s = 0] = String(t).split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function secToTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function normalizeTime(t) {
  if (!t) return null;
  const parts = String(t).split(":");
  const h = String(parts[0] || "0").padStart(2, "0");
  const m = String(parts[1] || "0").padStart(2, "0");
  return `${h}:${m}:00`;
}

function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATE — Kiểm tra configs không overlap, không gap
// ═══════════════════════════════════════════════════════════════

/**
 * Validate danh sách configs:
 *  1. from_time < to_time
 *  2. Không chồng chéo
 *  3. Sắp xếp theo from_time
 *  4. Optional: cover hết operating window
 *
 * @param {Array} configs - [{ from_time, to_time, headway_seconds, label? }]
 * @param {Object} options - { operatingStart, operatingEnd, requireFullCoverage }
 * @returns {Object} - { valid, errors, warnings }
 */
export function validateConfigs(configs = [], options = {}) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(configs) || configs.length === 0) {
    errors.push("Phải có ít nhất 1 khung giờ.");
    return { valid: false, errors, warnings };
  }

  // 1. Validate từng config
  const normalized = configs.map((c, i) => {
    const from = timeToSec(c.from_time);
    const to = timeToSec(c.to_time);
    const headway = parseInt(c.headway_seconds);

    if (!c.from_time || !c.to_time) {
      errors.push(`Khung #${i + 1}: thiếu giờ bắt đầu hoặc kết thúc.`);
    }
    if (from >= to) {
      errors.push(
        `Khung #${i + 1}: giờ bắt đầu (${c.from_time}) phải nhỏ hơn giờ kết thúc (${c.to_time}).`,
      );
    }
    if (isNaN(headway) || headway < 60) {
      errors.push(`Khung #${i + 1}: giãn cách phải >= 60 giây.`);
    }
    if (headway > 7200) {
      warnings.push(
        `Khung #${i + 1}: giãn cách ${Math.floor(headway / 60)} phút khá lớn — kiểm tra lại.`,
      );
    }

    return {
      from,
      to,
      from_time: normalizeTime(c.from_time),
      to_time: normalizeTime(c.to_time),
      headway_seconds: headway,
      label: c.label || null,
      originalIndex: i,
    };
  });

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // 2. Sort và check overlap
  normalized.sort((a, b) => a.from - b.from);

  for (let i = 1; i < normalized.length; i++) {
    const prev = normalized[i - 1];
    const cur = normalized[i];

    if (cur.from < prev.to) {
      errors.push(
        `Khung #${cur.originalIndex + 1} (${cur.from_time}–${cur.to_time}) ` +
          `chồng chéo với khung #${prev.originalIndex + 1} (${prev.from_time}–${prev.to_time}).`,
      );
    }

    if (cur.from > prev.to) {
      const gapMin = Math.floor((cur.from - prev.to) / 60);
      warnings.push(
        `Có khoảng trống ${gapMin} phút giữa ${secToTime(prev.to)} và ${secToTime(cur.from)}.`,
      );
    }
  }

  // 3. Check coverage với operating window
  if (options.operatingStart && options.operatingEnd) {
    const opStart = timeToSec(options.operatingStart);
    const opEnd = timeToSec(options.operatingEnd);

    const first = normalized[0];
    const last = normalized[normalized.length - 1];

    if (first.from > opStart) {
      const gapMin = Math.floor((first.from - opStart) / 60);
      warnings.push(
        `Thiếu config từ ${secToTime(opStart)} đến ${first.from_time} (${gapMin} phút).`,
      );
    }

    if (last.to < opEnd) {
      const gapMin = Math.floor((opEnd - last.to) / 60);
      warnings.push(
        `Thiếu config từ ${last.to_time} đến ${secToTime(opEnd)} (${gapMin} phút).`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// GET — Lấy configs của tuyến
// ═══════════════════════════════════════════════════════════════

/**
 * Lấy tất cả headway configs của tuyến (đã sort)
 */
export async function getConfigsByRoute(routeId) {
  const configs = await HeadwayConfig.findAll({
    where: { route_id: routeId },
    order: [
      ["sort_order", "ASC"],
      ["from_time", "ASC"],
    ],
  });

  return configs.map(toPlain);
}

// ═══════════════════════════════════════════════════════════════
// BULK REPLACE — Thay thế toàn bộ configs của tuyến
// ═══════════════════════════════════════════════════════════════

/**
 * Thay thế toàn bộ configs của tuyến
 * Dùng trong transaction để đảm bảo atomic
 *
 * @param {number} routeId
 * @param {Array} configs - [{ from_time, to_time, headway_seconds, label? }]
 */
export async function replaceConfigs(routeId, configs = []) {
  // 1. Kiểm tra route tồn tại
  const route = await Route.findByPk(routeId);
  if (!route) {
    const e = new Error("Không tìm thấy tuyến.");
    e.status = 404;
    throw e;
  }

  // 2. Load operations để lấy operating window
  const operations = await RouteOperation.findByPk(routeId);

  // 3. Validate
  const validation = validateConfigs(configs, {
    operatingStart: operations?.operating_start_time,
    operatingEnd: operations?.operating_end_time,
  });

  if (!validation.valid) {
    const e = new Error(validation.errors.join(" "));
    e.status = 400;
    e.validation = validation;
    throw e;
  }

  // 4. Transaction: xóa cũ + insert mới
  const transaction = await sequelize.transaction();
  try {
    await HeadwayConfig.destroy({
      where: { route_id: routeId },
      transaction,
    });

    const now = new Date();
    const rows = configs
      .map((c, idx) => ({
        route_id: routeId,
        from_time: normalizeTime(c.from_time),
        to_time: normalizeTime(c.to_time),
        headway_seconds: parseInt(c.headway_seconds),
        label: c.label || null,
        sort_order: idx,
        created_at: now,
        updated_at: now,
      }))
      // Sort trước khi insert
      .sort((a, b) => timeToSec(a.from_time) - timeToSec(b.from_time));

    const created = await HeadwayConfig.bulkCreate(rows, { transaction });

    await transaction.commit();

    return {
      configs: created.map(toPlain),
      warnings: validation.warnings,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE — Xóa toàn bộ configs của tuyến
// ═══════════════════════════════════════════════════════════════

export async function clearConfigs(routeId) {
  const deleted = await HeadwayConfig.destroy({
    where: { route_id: routeId },
  });
  return { deleted: deleted > 0, count: deleted };
}

// ═══════════════════════════════════════════════════════════════
// GET WITH MULTIPLIER — Trả về configs đã nhân multiplier
// ═══════════════════════════════════════════════════════════════

/**
 * Lấy configs đã áp dụng multiplier cho 1 service
 * Trả về array với headway_final_seconds
 *
 * @param {number} routeId
 * @param {number} multiplier - hệ số nhân
 */
export async function getEffectiveConfigs(routeId, multiplier = 1.0) {
  const configs = await getConfigsByRoute(routeId);

  return configs.map((c) => ({
    ...c,
    headway_effective_seconds: Math.round(c.headway_seconds * multiplier),
  }));
}

// ═══════════════════════════════════════════════════════════════
// PRESET — Tạo config mẫu theo loại tuyến
// ═══════════════════════════════════════════════════════════════

/**
 * Trả về config mẫu theo loại tuyến
 * Dùng để gợi ý khi admin tạo config mới
 */
export function getPresetConfigs(category = "urban") {
  if (category === "airport") {
    return [
      {
        from_time: "05:00",
        to_time: "06:00",
        headway_seconds: 900,
        label: "Sáng sớm",
      },
      {
        from_time: "06:00",
        to_time: "09:00",
        headway_seconds: 600,
        label: "Cao điểm sáng",
      },
      {
        from_time: "09:00",
        to_time: "17:00",
        headway_seconds: 900,
        label: "Bình thường",
      },
      {
        from_time: "17:00",
        to_time: "20:00",
        headway_seconds: 600,
        label: "Cao điểm chiều",
      },
      {
        from_time: "20:00",
        to_time: "22:00",
        headway_seconds: 900,
        label: "Tối",
      },
    ];
  }

  return [
    {
      from_time: "05:00",
      to_time: "06:00",
      headway_seconds: 1200,
      label: "Sáng sớm",
    },
    {
      from_time: "06:00",
      to_time: "09:00",
      headway_seconds: 480,
      label: "Cao điểm sáng",
    },
    {
      from_time: "09:00",
      to_time: "17:00",
      headway_seconds: 900,
      label: "Bình thường",
    },
    {
      from_time: "17:00",
      to_time: "20:00",
      headway_seconds: 480,
      label: "Cao điểm chiều",
    },
    {
      from_time: "20:00",
      to_time: "22:00",
      headway_seconds: 1200,
      label: "Tối",
    },
  ];
}
