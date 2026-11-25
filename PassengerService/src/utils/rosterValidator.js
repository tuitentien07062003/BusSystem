import { Op } from "sequelize";
import Roster from "../models/rosterModel.js";
import ShiftTemplate from "../models/shiftTemplateModel.js";
import DriverUnavailability from "../models/driverUnavailabilityModel.js";
import { timeToSec, trimTime, hoursBetween } from "./timeUtils.js";
import { addDays, getWeekKey } from "./dateUtils.js";

// ═══════════════════════════════════════════════════════════════
// Rule 1: 11h rule
// ═══════════════════════════════════════════════════════════════
/**
 * Check 11h rule với ngày X-1 và X+1
 * @param {number} employeeId
 * @param {string} date - "YYYY-MM-DD"
 * @param {object} newShift - { drive_start, drive_end, handover_end }
 * @param {object} options - { excludeRosterId }
 */
export async function check11hRule(
  employeeId,
  date,
  newShift,
  { excludeRosterId } = {},
) {
  const errors = [];

  // ── Check với ngày TRƯỚC ──
  const prev = await findRosterWithShift(
    employeeId,
    addDays(date, -1),
    excludeRosterId,
  );
  if (prev) {
    const prevEnd = prev.shift.handover_end || prev.shift.drive_end;
    const gap = hoursBetween(prevEnd, newShift.drive_start);
    if (gap < 11) {
      errors.push(
        `Kết ca ${trimTime(prevEnd)} ngày ${prev.date} → ca mới bắt đầu ${trimTime(newShift.drive_start)} ` +
          `chỉ có ${gap.toFixed(1)}h nghỉ (cần ≥ 11h).`,
      );
    }
  }

  // ── Check với ngày SAU ──
  const next = await findRosterWithShift(
    employeeId,
    addDays(date, 1),
    excludeRosterId,
  );
  if (next) {
    const newEnd = newShift.handover_end || newShift.drive_end;
    const gap = hoursBetween(newEnd, next.shift.drive_start);
    if (gap < 11) {
      errors.push(
        `Ca mới kết ${trimTime(newEnd)} → ca ngày ${next.date} bắt đầu ${trimTime(next.shift.drive_start)} ` +
          `chỉ có ${gap.toFixed(1)}h nghỉ (cần ≥ 11h).`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Helper: tìm Roster của employee ngày X, join với shift template
 */
async function findRosterWithShift(employeeId, date, excludeId) {
  const where = {
    employee_id: employeeId,
    date,
    status: { [Op.notIn]: ["off", "absent"] },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const r = await Roster.findOne({
    where,
    include: [{ model: ShiftTemplate, as: "shift" }],
  });

  if (!r) return null;
  return {
    date: r.date,
    shift: r.shift?.get({ plain: true }),
  };
}

// ═══════════════════════════════════════════════════════════════
// Rule 2: Max 6 ngày/tuần
// ═══════════════════════════════════════════════════════════════
/**
 * Check max 6 working days trong tuần ISO
 * @param {number} employeeId
 * @param {string} date
 * @param {object} options - { excludeRosterId, maxDays = 6 }
 */
export async function checkMaxDaysPerWeek(
  employeeId,
  date,
  { excludeRosterId, maxDays = 6 } = {},
) {
  // Tính range của tuần chứa `date`
  const weekKey = getWeekKey(date);
  const weekDates = await getWeekDates(date);

  const where = {
    employee_id: employeeId,
    date: { [Op.in]: weekDates },
    status: { [Op.notIn]: ["off", "absent"] },
  };
  if (excludeRosterId) where.id = { [Op.ne]: excludeRosterId };

  const count = await Roster.count({ where });

  // +1 vì đang check thêm 1 ngày mới
  if (count + 1 > maxDays) {
    return {
      valid: false,
      errors: [
        `Tuần ${weekKey} đã có ${count} ngày làm việc, thêm ngày này thành ${count + 1} (vượt mức ${maxDays}).`,
      ],
    };
  }

  return { valid: true, errors: [], current_days: count };
}

/**
 * Lấy 7 ngày của tuần ISO chứa `date`
 */
async function getWeekDates(date) {
  // ISO week: thứ 2 → chủ nhật
  const { parseDate, formatDate } = await import("./dateUtils.js");
  const d = parseDate(date);
  const dayOfWeek = (d.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6

  const monday = new Date(d);
  monday.setUTCDate(monday.getUTCDate() - dayOfWeek);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setUTCDate(dd.getUTCDate() + i);
    dates.push(formatDate(dd));
  }
  return dates;
}

// ═══════════════════════════════════════════════════════════════
// Rule 3: Không trùng ca trong ngày
// ═══════════════════════════════════════════════════════════════
export async function checkNoDuplicateInDay(
  employeeId,
  date,
  { excludeRosterId } = {},
) {
  const where = { employee_id: employeeId, date };
  if (excludeRosterId) where.id = { [Op.ne]: excludeRosterId };

  const existing = await Roster.findOne({ where });
  if (existing) {
    return {
      valid: false,
      errors: [
        `Nhân viên đã có Roster ngày ${date} (status: ${existing.status}).`,
      ],
    };
  }

  return { valid: true, errors: [] };
}

// ═══════════════════════════════════════════════════════════════
// Rule 4: Không gán vào ngày đang nghỉ phép
// ═══════════════════════════════════════════════════════════════
export async function checkUnavailability(employeeId, date) {
  const unavail = await DriverUnavailability.findOne({
    where: {
      driver_id: employeeId,
      date_from: { [Op.lte]: date },
      date_to: { [Op.gte]: date },
    },
  });

  if (unavail) {
    return {
      valid: false,
      errors: [
        `Nhân viên đang nghỉ (${unavail.type}): ${unavail.reason || "không có lý do"}.`,
      ],
    };
  }

  return { valid: true, errors: [] };
}

// ═══════════════════════════════════════════════════════════════
// MASTER VALIDATOR — gọi tất cả rules
// ═══════════════════════════════════════════════════════════════
export async function validateRoster({
  employee_id,
  date,
  shift_template_id,
  status = "scheduled",
  exclude_roster_id,
  employee, // object (để check type + is_active)
  shift, // object shift template
} = {}) {
  const errors = [];

  // Nếu là ngày off/absent → không cần check nhiều
  if (status === "off" || status === "absent") {
    // Chỉ cần check không trùng
    const dup = await checkNoDuplicateInDay(employee_id, date, {
      excludeRosterId: exclude_roster_id,
    });
    if (!dup.valid) errors.push(...dup.errors);
    return { valid: errors.length === 0, errors };
  }

  // ── Check employee ──
  if (!employee) {
    errors.push("Không tìm thấy nhân viên.");
    return { valid: false, errors };
  }
  if (employee.type !== "driver" && employee.type !== "co_driver") {
    errors.push(`Nhân viên ${employee.employee_code} không phải tài xế.`);
  }
  if (!employee.is_active) {
    errors.push(`Nhân viên ${employee.employee_code} đã ngừng hoạt động.`);
  }

  // ── Check shift ──
  if (!shift) {
    errors.push("Không tìm thấy ca làm việc.");
    return { valid: false, errors };
  }

  // ── Rule 3: Trùng ca trong ngày ──
  const dup = await checkNoDuplicateInDay(employee_id, date, {
    excludeRosterId: exclude_roster_id,
  });
  if (!dup.valid) errors.push(...dup.errors);

  // ── Rule 4: Nghỉ phép ──
  const unavail = await checkUnavailability(employee_id, date);
  if (!unavail.valid) errors.push(...unavail.errors);

  // ── Rule 1: 11h ──
  const rule11 = await check11hRule(employee_id, date, shift, {
    excludeRosterId: exclude_roster_id,
  });
  if (!rule11.valid) errors.push(...rule11.errors);

  // ── Rule 2: Max 6 ngày/tuần ──
  const maxDays = await checkMaxDaysPerWeek(employee_id, date, {
    excludeRosterId: exclude_roster_id,
  });
  if (!maxDays.valid) errors.push(...maxDays.errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}
