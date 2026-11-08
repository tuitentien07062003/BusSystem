import { Op } from "sequelize";
import sequelize from "../config/database.js";
import ShiftTemplate from "../models/shiftTemplateModel.js";
import Roster from "../models/rosterModel.js";
import DutyAssignment from "../models/dutyAssignmentModel.js";
import {
  timeToSec,
  normalizeTime,
  trimTime,
  timeRangesOverlap,
} from "../utils/timeUtils.js";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

function computeTotalHours(t) {
  const start = timeToSec(t.prep_start);
  const end = timeToSec(t.handover_end || t.drive_end);
  if (end <= start) return 0;
  return Math.round(((end - start) / 3600) * 10) / 10;
}

function formatTemplate(t) {
  if (!t) return null;
  const o = toPlain(t);
  return {
    id: o.id,
    code: o.code,
    name: o.name,
    prep_start: trimTime(o.prep_start),
    prep_end: trimTime(o.prep_end),
    drive_start: trimTime(o.drive_start),
    drive_end: trimTime(o.drive_end),
    handover_start: trimTime(o.handover_start),
    handover_end: trimTime(o.handover_end),
    buffer_minutes: o.buffer_minutes,
    is_active: o.is_active,
    total_hours: computeTotalHours(o),
  };
}

// ═══════════════════════════════════════════════════════════════
// VALIDATE — dùng chung cho create / update / validate endpoint
// ═══════════════════════════════════════════════════════════════
async function validateTemplate(payload, { excludeId = null } = {}) {
  const errors = [];
  const warnings = [];

  // ── 1. Required cơ bản ──
  if (!payload.code || !String(payload.code).trim()) {
    errors.push("code không được để trống.");
  }
  if (!payload.name || !String(payload.name).trim()) {
    errors.push("name không được để trống.");
  }
  if (!payload.prep_start || !payload.prep_end) {
    errors.push("prep_start và prep_end là bắt buộc.");
  }
  if (!payload.drive_start || !payload.drive_end) {
    errors.push("drive_start và drive_end là bắt buộc.");
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // ── 2. Thứ tự thời gian ──
  const prepS = timeToSec(payload.prep_start);
  const prepE = timeToSec(payload.prep_end);
  const driveS = timeToSec(payload.drive_start);
  const driveE = timeToSec(payload.drive_end);
  const handS = payload.handover_start
    ? timeToSec(payload.handover_start)
    : null;
  const handE = payload.handover_end ? timeToSec(payload.handover_end) : null;

  if (prepS >= prepE) {
    errors.push("prep_start phải nhỏ hơn prep_end.");
  }
  if (prepE > driveS) {
    errors.push("prep_end không được sau drive_start.");
  }
  if (driveS >= driveE) {
    errors.push("drive_start phải nhỏ hơn drive_end.");
  }
  if (handS !== null && driveE > handS) {
    errors.push("drive_end không được sau handover_start.");
  }
  if (handS !== null && handE !== null && handS >= handE) {
    errors.push("handover_start phải nhỏ hơn handover_end.");
  }

  // ── 3. Buffer ──
  const buf = parseInt(payload.buffer_minutes);
  if (isNaN(buf) || buf < 15 || buf > 120) {
    errors.push("buffer_minutes phải trong khoảng 15 - 120.");
  }

  // ── 4. Tổng thời gian ca ≤ 12h ──
  const totalEnd = handE !== null ? handE : driveE;
  const totalHours = (totalEnd - prepS) / 3600;
  if (totalHours > 12) {
    errors.push(
      `Tổng thời gian ca ${totalHours.toFixed(1)}h vượt mức 12h cho phép.`,
    );
  }
  if (totalHours > 11) {
    warnings.push(
      `Tổng thời gian ca ${totalHours.toFixed(1)}h gần ngưỡng 12h.`,
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // ── 5. Chỉ cho tối đa 2 template active ──
  const willBeActive = payload.is_active !== false;

  if (willBeActive) {
    const where = { is_active: true };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const activeTemplates = await ShiftTemplate.findAll({ where });

    if (activeTemplates.length >= 2) {
      errors.push(
        `Đã có ${activeTemplates.length} ca đang hoạt động. Chỉ cho phép tối đa 2 ca (sáng + tối).`,
      );
    }

    // ── 6. Không overlap drive window với template active khác ──
    for (const other of activeTemplates) {
      const otherPlain = toPlain(other);
      if (
        timeRangesOverlap(
          payload.drive_start,
          payload.drive_end,
          otherPlain.drive_start,
          otherPlain.drive_end,
        )
      ) {
        errors.push(
          `Khung chạy (${trimTime(payload.drive_start)}–${trimTime(
            payload.drive_end,
          )}) trùng với ca "${otherPlain.name}" (${trimTime(
            otherPlain.drive_start,
          )}–${trimTime(otherPlain.drive_end)}).`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════
export async function getAllTemplates({ is_active } = {}) {
  const where = {};
  if (typeof is_active === "boolean") where.is_active = is_active;

  const rows = await ShiftTemplate.findAll({
    where,
    order: [["id", "ASC"]],
  });

  return { data: rows.map(formatTemplate) };
}

// ═══════════════════════════════════════════════════════════════
// GET ACTIVE — 2 template đang dùng, kèm usage count
// ═══════════════════════════════════════════════════════════════
export async function getActiveTemplates() {
  const rows = await ShiftTemplate.findAll({
    where: { is_active: true },
    order: [["id", "ASC"]],
  });

  const data = [];
  for (const row of rows) {
    const template = formatTemplate(row);
    template.usage = await getUsageStats(row.id);
    data.push(template);
  }

  return { data };
}

// ═══════════════════════════════════════════════════════════════
// GET BY ID — kèm usage stats
// ═══════════════════════════════════════════════════════════════
export async function getTemplateById(id) {
  const t = await ShiftTemplate.findByPk(id);
  if (!t) {
    const err = new Error("Không tìm thấy ca làm việc.");
    err.status = 404;
    throw err;
  }

  const formatted = formatTemplate(t);
  formatted.usage = await getUsageStats(id);
  return formatted;
}

// ═══════════════════════════════════════════════════════════════
// USAGE STATS — đếm Roster + DutyAssignment dùng template này
// ═══════════════════════════════════════════════════════════════
export async function getUsageStats(id) {
  const [rosterCount, assignmentCount] = await Promise.all([
    Roster.count({ where: { shift_template_id: id } }),
    DutyAssignment.count({ where: { shift_template_id: id } }),
  ]);

  // Đếm Roster theo status
  const byStatus = await Roster.findAll({
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where: { shift_template_id: id },
    group: ["status"],
    raw: true,
  });

  const statusMap = {};
  byStatus.forEach((r) => {
    statusMap[r.status] = parseInt(r.count);
  });

  return {
    rosters: rosterCount,
    assignments: assignmentCount,
    by_status: statusMap,
  };
}

// ═══════════════════════════════════════════════════════════════
// IMPACT — phân tích ảnh hưởng trước khi update
// ═══════════════════════════════════════════════════════════════
export async function getTemplateImpact(id) {
  const t = await ShiftTemplate.findByPk(id);
  if (!t) {
    const err = new Error("Không tìm thấy ca làm việc.");
    err.status = 404;
    throw err;
  }

  // Đếm Roster
  const rosterCount = await Roster.count({
    where: { shift_template_id: id },
  });

  // Đếm DutyAssignment
  const assignmentCount = await DutyAssignment.count({
    where: { shift_template_id: id },
  });

  // Đếm distinct employee
  const distinctDrivers = await Roster.count({
    where: { shift_template_id: id },
    distinct: true,
    col: "employee_id",
  });

  // Date range của Roster liên quan
  const dateRange = await Roster.findOne({
    attributes: [
      [sequelize.fn("MIN", sequelize.col("date")), "earliest"],
      [sequelize.fn("MAX", sequelize.col("date")), "latest"],
    ],
    where: { shift_template_id: id },
    raw: true,
  });

  return {
    template_id: id,
    template_name: t.name,
    affected: {
      rosters: rosterCount,
      assignments: assignmentCount,
      distinct_drivers: distinctDrivers,
    },
    date_range: {
      earliest: dateRange?.earliest || null,
      latest: dateRange?.latest || null,
    },
    note:
      rosterCount === 0 && assignmentCount === 0
        ? "Không có Roster hay phân công nào bị ảnh hưởng."
        : `Cập nhật ca sẽ ảnh hưởng tới ${rosterCount} Roster và ${assignmentCount} phân công (không tự động cập nhật).`,
  };
}

// ═══════════════════════════════════════════════════════════════
// VALIDATE ENDPOINT — chỉ validate, không lưu
// ═══════════════════════════════════════════════════════════════
export async function validateTemplateData(
  payload = {},
  { excludeId = null } = {},
) {
  return validateTemplate(payload, { excludeId });
}

// ═══════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════
export async function createTemplate(payload = {}) {
  const validation = await validateTemplate(payload);
  if (!validation.valid) {
    const err = new Error(validation.errors.join(" "));
    err.status = 400;
    err.validation = validation;
    throw err;
  }

  const code = String(payload.code).trim().toUpperCase();
  const dup = await ShiftTemplate.findOne({ where: { code } });
  if (dup) {
    const err = new Error(`code "${code}" đã tồn tại.`);
    err.status = 409;
    throw err;
  }

  const created = await ShiftTemplate.create({
    code,
    name: String(payload.name).trim(),
    prep_start: normalizeTime(payload.prep_start),
    prep_end: normalizeTime(payload.prep_end),
    drive_start: normalizeTime(payload.drive_start),
    drive_end: normalizeTime(payload.drive_end),
    handover_start: payload.handover_start
      ? normalizeTime(payload.handover_start)
      : null,
    handover_end: payload.handover_end
      ? normalizeTime(payload.handover_end)
      : null,
    buffer_minutes: parseInt(payload.buffer_minutes) || 45,
    is_active: payload.is_active !== undefined ? !!payload.is_active : true,
  });

  return {
    data: formatTemplate(created),
    warnings: validation.warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// UPDATE — không auto recalc, chỉ cảnh báo impact
// ═══════════════════════════════════════════════════════════════
export async function updateTemplate(id, payload = {}) {
  const existing = await ShiftTemplate.findByPk(id);
  if (!existing) {
    const err = new Error("Không tìm thấy ca làm việc.");
    err.status = 404;
    throw err;
  }

  // Merge payload hiện tại với existing để validate toàn bộ
  const merged = {
    code: payload.code !== undefined ? payload.code : existing.code,
    name: payload.name !== undefined ? payload.name : existing.name,
    prep_start:
      payload.prep_start !== undefined
        ? payload.prep_start
        : existing.prep_start,
    prep_end:
      payload.prep_end !== undefined ? payload.prep_end : existing.prep_end,
    drive_start:
      payload.drive_start !== undefined
        ? payload.drive_start
        : existing.drive_start,
    drive_end:
      payload.drive_end !== undefined ? payload.drive_end : existing.drive_end,
    handover_start:
      payload.handover_start !== undefined
        ? payload.handover_start
        : existing.handover_start,
    handover_end:
      payload.handover_end !== undefined
        ? payload.handover_end
        : existing.handover_end,
    buffer_minutes:
      payload.buffer_minutes !== undefined
        ? payload.buffer_minutes
        : existing.buffer_minutes,
    is_active:
      payload.is_active !== undefined ? payload.is_active : existing.is_active,
  };

  // Lấy impact TRƯỚC khi update để trả cảnh báo
  const impactBefore = await getTemplateImpact(id);

  const validation = await validateTemplate(merged, { excludeId: id });
  if (!validation.valid) {
    const err = new Error(validation.errors.join(" "));
    err.status = 400;
    err.validation = validation;
    throw err;
  }

  // Check unique code nếu đổi
  const updates = {};
  if (payload.code !== undefined) {
    const code = String(payload.code).trim().toUpperCase();
    if (code !== existing.code) {
      const dup = await ShiftTemplate.findOne({
        where: { code, id: { [Op.ne]: id } },
      });
      if (dup) {
        const err = new Error(`code "${code}" đã tồn tại.`);
        err.status = 409;
        throw err;
      }
    }
    updates.code = code;
  }

  if (payload.name !== undefined) updates.name = String(payload.name).trim();
  if (payload.prep_start !== undefined)
    updates.prep_start = normalizeTime(payload.prep_start);
  if (payload.prep_end !== undefined)
    updates.prep_end = normalizeTime(payload.prep_end);
  if (payload.drive_start !== undefined)
    updates.drive_start = normalizeTime(payload.drive_start);
  if (payload.drive_end !== undefined)
    updates.drive_end = normalizeTime(payload.drive_end);
  if (payload.handover_start !== undefined) {
    updates.handover_start = payload.handover_start
      ? normalizeTime(payload.handover_start)
      : null;
  }
  if (payload.handover_end !== undefined) {
    updates.handover_end = payload.handover_end
      ? normalizeTime(payload.handover_end)
      : null;
  }
  if (payload.buffer_minutes !== undefined) {
    updates.buffer_minutes = parseInt(payload.buffer_minutes);
  }
  if (payload.is_active !== undefined) {
    updates.is_active = !!payload.is_active;
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error("Không có trường nào để cập nhật.");
    err.status = 400;
    throw err;
  }

  await existing.update(updates);

  // Re-fetch để trả data mới
  const updated = await getTemplateById(id);

  return {
    data: updated,
    warnings: validation.warnings,
    impact: {
      rosters_affected: impactBefore.affected.rosters,
      assignments_affected: impactBefore.affected.assignments,
      message: impactBefore.note,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// CHANGE STATUS — có guard: chặn tắt nếu còn Roster
// ═══════════════════════════════════════════════════════════════
export async function changeTemplateStatus(id, is_active) {
  if (typeof is_active !== "boolean") {
    const err = new Error("is_active phải là kiểu boolean.");
    err.status = 400;
    throw err;
  }

  const t = await ShiftTemplate.findByPk(id);
  if (!t) {
    const err = new Error("Không tìm thấy ca làm việc.");
    err.status = 404;
    throw err;
  }

  // Nếu đang tắt và còn Roster → chặn
  if (!is_active) {
    const rosterCount = await Roster.count({
      where: { shift_template_id: id },
    });
    if (rosterCount > 0) {
      const err = new Error(
        `Không thể tắt ca "${t.name}". Còn ${rosterCount} Roster đang sử dụng. ` +
          `Vui lòng chuyển các Roster này sang ca khác trước.`,
      );
      err.status = 409;
      throw err;
    }
  }

  await t.update({ is_active });

  return getTemplateById(id);
}
