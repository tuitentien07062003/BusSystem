import { Op } from "sequelize";
import sequelize from "../config/database.js";
import ShiftSwap from "../models/shiftSwapModel.js";
import DutyAssignment from "../models/dutyAssignmentModel.js";
import Roster from "../models/rosterModel.js";
import Employee from "../models/employeeModel.js";
import Vehicle from "../models/vehicleModel.js";
import VehicleType from "../models/vehicleTypeModel.js";
import ShiftTemplate from "../models/shiftTemplateModel.js";
import DriverUnavailability from "../models/driverUnavailabilityModel.js";
import { timeToSec, trimTime, hoursBetween } from "../utils/timeUtils.js";
import { addDays, parseDate, formatDate } from "../utils/dateUtils.js";

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════
const MAX_HOURS_PER_WEEK = 60;
const MIN_REST_HOURS = 11;

// Bằng lái tối thiểu theo loại xe
const LICENSE_BY_TYPE = {
  BUS_45: ["D", "E"],
  BUS_65: ["D", "E"],
  EBUS_60: ["D", "E"],
};

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

function formatSwap(s) {
  if (!s) return null;
  const o = toPlain(s);
  return {
    id: o.id,
    original_employee_id: o.original_employee_id,
    original_employee: o.original_employee
      ? {
          id: o.original_employee.id,
          employee_code: o.original_employee.employee_code,
          full_name: o.original_employee.full_name,
        }
      : null,
    substitute_employee_id: o.substitute_employee_id,
    substitute_employee: o.substitute_employee
      ? {
          id: o.substitute_employee.id,
          employee_code: o.substitute_employee.employee_code,
          full_name: o.substitute_employee.full_name,
        }
      : null,
    duty_assignment_id: o.duty_assignment_id,
    assignment: o.assignment
      ? {
          id: o.assignment.id,
          date: o.assignment.date,
          route_id: o.assignment.route_id,
          vehicle_id: o.assignment.vehicle_id,
          start_time: trimTime(o.assignment.start_time),
          end_time: trimTime(o.assignment.end_time),
        }
      : null,
    swap_date: o.swap_date,
    reason: o.reason,
    requested_by: o.requested_by,
    status: o.status,
    created_at: o.created_at,
    completed_at: o.completed_at,
  };
}

const SWAP_INCLUDE = [
  {
    model: Employee,
    as: "original_employee",
    attributes: ["id", "employee_code", "full_name"],
    required: false,
  },
  {
    model: Employee,
    as: "substitute_employee",
    attributes: ["id", "employee_code", "full_name"],
    required: false,
  },
  {
    model: DutyAssignment,
    as: "assignment",
    required: false,
  },
];

// ═══════════════════════════════════════════════════════════════
// Tính 7 ngày của tuần ISO chứa `date`
// ═══════════════════════════════════════════════════════════════
function getWeekDates(date) {
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
// Check license — tài xế có bằng phù hợp với loại xe không?
// ═══════════════════════════════════════════════════════════════
function checkLicense(driver, vehicleTypeCode) {
  if (!vehicleTypeCode) return { valid: true };
  const required = LICENSE_BY_TYPE[vehicleTypeCode];
  if (!required) return { valid: true };

  const driverClass = (driver.license_class || "").toUpperCase();
  if (!driverClass) {
    return {
      valid: false,
      reason: `Tài xế ${driver.employee_code} chưa có thông tin bằng lái.`,
    };
  }

  if (!required.includes(driverClass)) {
    return {
      valid: false,
      reason: `Tài xế ${driver.employee_code} có bằng "${driverClass}", không phù hợp với xe loại "${vehicleTypeCode}" (cần ${required.join(" hoặc ")}).`,
    };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// Suggest substitutes — 4 tiêu chí
// ═══════════════════════════════════════════════════════════════
export async function suggestSubstitutes(assignmentId) {
  const assignmentIdInt = parseInt(assignmentId);
  if (!assignmentIdInt) {
    const err = new Error("assignment_id là bắt buộc.");
    err.status = 400;
    throw err;
  }

  // ── Load assignment ──
  const assignment = await DutyAssignment.findByPk(assignmentIdInt, {
    include: [
      {
        model: Employee,
        as: "driver",
        attributes: ["id", "employee_code", "full_name"],
      },
      {
        model: Vehicle,
        as: "vehicle",
        attributes: ["id", "vehicle_code", "vehicle_type_id"],
      },
      { model: ShiftTemplate, as: "shift", required: false },
    ],
  });

  if (!assignment) {
    const err = new Error("Không tìm thấy phân công.");
    err.status = 404;
    throw err;
  }

  const a = toPlain(assignment);
  const date = a.date;
  const shiftTemplateId = a.shift_template_id;
  const driveStart = a.shift?.drive_start;
  const driveEnd = a.shift?.drive_end;
  const vehicleTypeId = a.vehicle?.vehicle_type_id;

  // ── Load vehicle type ──
  let vehicleTypeCode = null;
  if (vehicleTypeId) {
    const vt = await VehicleType.findByPk(vehicleTypeId);
    vehicleTypeCode = vt ? toPlain(vt).type_code : null;
  }

  // ── Load all active drivers ──
  const allDrivers = await Employee.findAll({
    where: {
      type: "driver",
      is_active: true,
      id: { [Op.ne]: a.employee_id }, // loại chính tài xế đang cần thay
    },
    order: [["id", "ASC"]],
  });

  const driverIds = allDrivers.map((d) => d.id);

  // ── Batch query để tránh N+1 ──

  // 1. Roster cùng ngày của tất cả drivers
  const rostersSameDay = await Roster.findAll({
    where: {
      employee_id: { [Op.in]: driverIds },
      date,
    },
    attributes: ["id", "employee_id", "shift_template_id", "status"],
    raw: true,
  });
  const rosterByDriverSameDay = new Map();
  for (const r of rostersSameDay) {
    rosterByDriverSameDay.set(r.employee_id, r);
  }

  // 2. Unavailability active
  const unavails = await DriverUnavailability.findAll({
    where: {
      driver_id: { [Op.in]: driverIds },
      date_from: { [Op.lte]: date },
      date_to: { [Op.gte]: date },
    },
    raw: true,
  });
  const unavailSet = new Set(unavails.map((u) => u.driver_id));

  // 3. Roster của ngày X-1 và X+1 (check 11h)
  const prevDate = addDays(date, -1);
  const nextDate = addDays(date, 1);

  const rostersAround = await Roster.findAll({
    where: {
      employee_id: { [Op.in]: driverIds },
      date: { [Op.in]: [prevDate, nextDate] },
      status: { [Op.notIn]: ["off", "absent"] },
    },
    include: [{ model: ShiftTemplate, as: "shift" }],
  });
  const prevRosterByDriver = new Map();
  const nextRosterByDriver = new Map();
  for (const r of rostersAround) {
    const o = toPlain(r);
    if (o.date === prevDate) prevRosterByDriver.set(o.employee_id, o);
    if (o.date === nextDate) nextRosterByDriver.set(o.employee_id, o);
  }

  // 4. Roster trong tuần (check max hours)
  const weekDates = getWeekDates(date);
  const weeklyRosters = await Roster.findAll({
    where: {
      employee_id: { [Op.in]: driverIds },
      date: { [Op.in]: weekDates },
      status: { [Op.notIn]: ["off", "absent", "swapped"] },
    },
    include: [{ model: ShiftTemplate, as: "shift" }],
  });
  const weeklyHoursByDriver = new Map();
  for (const r of weeklyRosters) {
    const o = toPlain(r);
    if (!o.shift) continue;
    const hours =
      (timeToSec(o.shift.drive_end) - timeToSec(o.shift.drive_start)) / 3600;
    weeklyHoursByDriver.set(
      o.employee_id,
      (weeklyHoursByDriver.get(o.employee_id) || 0) + hours,
    );
  }

  // ── Filter từng driver ──
  const candidates = [];
  const newShiftHours =
    driveStart && driveEnd
      ? (timeToSec(driveEnd) - timeToSec(driveStart)) / 3600
      : 0;

  for (const driver of allDrivers) {
    const d = toPlain(driver);
    const reasons = [];

    // Tiêu chí 1: Roster cùng ngày
    const sameDay = rosterByDriverSameDay.get(d.id);
    if (sameDay && sameDay.status !== "off") {
      if (sameDay.shift_template_id !== shiftTemplateId) {
        reasons.push(`Đã có Roster ca khác ngày ${date}.`);
      }
    }

    // Tiêu chí 2: Unavailability
    if (unavailSet.has(d.id)) {
      reasons.push("Đang trong thời gian nghỉ (unavailability).");
    }

    // Tiêu chí 3: License
    const licenseCheck = checkLicense(d, vehicleTypeCode);
    if (!licenseCheck.valid) {
      reasons.push(licenseCheck.reason);
    }

    // Tiêu chí 4a: 11h rule với ngày trước
    if (driveStart && prevRosterByDriver.has(d.id)) {
      const prev = prevRosterByDriver.get(d.id);
      if (prev.shift) {
        const prevEnd = prev.shift.handover_end || prev.shift.drive_end;
        const gap = hoursBetween(prevEnd, driveStart);
        if (gap < MIN_REST_HOURS) {
          reasons.push(
            `Vi phạm 11h nghỉ: kết ca ${trimTime(prevEnd)} ngày ${prevDate}, ca mới bắt đầu ${trimTime(driveStart)} (chỉ ${gap.toFixed(1)}h).`,
          );
        }
      }
    }

    // Tiêu chí 4b: 11h rule với ngày sau
    if (driveEnd && nextRosterByDriver.has(d.id)) {
      const next = nextRosterByDriver.get(d.id);
      if (next.shift) {
        const gap = hoursBetween(driveEnd, next.shift.drive_start);
        if (gap < MIN_REST_HOURS) {
          reasons.push(
            `Vi phạm 11h nghỉ: ca mới kết ${trimTime(driveEnd)}, ca ngày ${nextDate} bắt đầu ${trimTime(next.shift.drive_start)} (chỉ ${gap.toFixed(1)}h).`,
          );
        }
      }
    }

    // Tiêu chí 4c: Max hours/tuần
    const currentHours = weeklyHoursByDriver.get(d.id) || 0;
    if (currentHours + newShiftHours > MAX_HOURS_PER_WEEK) {
      reasons.push(
        `Vượt giờ/tuần: đã có ${currentHours.toFixed(1)}h, thêm ${newShiftHours.toFixed(1)}h thành ${(currentHours + newShiftHours).toFixed(1)}h (max ${MAX_HOURS_PER_WEEK}h).`,
      );
    }

    candidates.push({
      driver: {
        id: d.id,
        employee_code: d.employee_code,
        full_name: d.full_name,
        license_class: d.license_class,
      },
      eligible: reasons.length === 0,
      reasons,
      current_weekly_hours: Math.round(currentHours * 10) / 10,
      new_shift_hours: Math.round(newShiftHours * 10) / 10,
    });
  }

  // ── Chỉ lấy eligible ──
  const eligible = candidates.filter((c) => c.eligible);
  const ineligible = candidates.filter((c) => !c.eligible);

  return {
    assignment: {
      id: a.id,
      date: a.date,
      route_id: a.route_id,
      vehicle_id: a.vehicle_id,
      vehicle_code: a.vehicle?.vehicle_code || null,
      vehicle_type: vehicleTypeCode,
      shift_code: a.shift?.code || null,
      start_time: trimTime(a.start_time),
      end_time: trimTime(a.end_time),
      original_driver: a.driver
        ? {
            id: a.driver.id,
            employee_code: a.driver.employee_code,
            full_name: a.driver.full_name,
          }
        : null,
    },
    total_candidates: candidates.length,
    eligible_count: eligible.length,
    eligible: eligible.slice(0, 10),
    ineligible_sample: ineligible.slice(0, 5),
  };
}

// ═══════════════════════════════════════════════════════════════
// VALIDATE — trước khi commit swap
// ═══════════════════════════════════════════════════════════════
async function validateSwap(assignmentId, substituteEmployeeId) {
  const errors = [];

  const assignment = await DutyAssignment.findByPk(assignmentId, {
    include: [
      { model: Vehicle, as: "vehicle", attributes: ["id", "vehicle_type_id"] },
      { model: ShiftTemplate, as: "shift", required: false },
    ],
  });
  if (!assignment) {
    errors.push("Không tìm thấy phân công.");
    return { valid: false, errors };
  }

  const a = toPlain(assignment);

  if (a.status === "cancelled" || a.status === "completed") {
    errors.push(`Không thể swap phân công đang ở trạng thái "${a.status}".`);
  }

  const substitute = await Employee.findByPk(substituteEmployeeId);
  if (!substitute) {
    errors.push("Không tìm thấy tài xế thay thế.");
    return { valid: false, errors };
  }
  const sub = toPlain(substitute);

  if (sub.type !== "driver") {
    errors.push(`Nhân viên ${sub.employee_code} không phải tài xế.`);
  }
  if (!sub.is_active) {
    errors.push(`Tài xế ${sub.employee_code} đang ngưng hoạt động.`);
  }
  if (sub.id === a.employee_id) {
    errors.push("Tài xế thay thế trùng với tài xế hiện tại.");
  }

  if (errors.length > 0) return { valid: false, errors };

  const date = a.date;
  const driveStart = a.shift?.drive_start;
  const driveEnd = a.shift?.drive_end;

  // ── Roster cùng ngày của substitute ──
  const sameDayRoster = await Roster.findOne({
    where: { employee_id: sub.id, date },
  });
  if (sameDayRoster) {
    const r = toPlain(sameDayRoster);
    if (r.status !== "off" && r.shift_template_id !== a.shift_template_id) {
      errors.push(
        `Tài xế ${sub.employee_code} đã có Roster ca khác ngày ${date} (shift_template: ${r.shift_template_id}).`,
      );
    }
  }

  // Check thêm: tài xế có assignment cùng ngày chưa?
  const existingAssignment = await DutyAssignment.findOne({
    where: {
      employee_id: sub.id,
      date,
      id: { [Op.ne]: a.id },
      status: { [Op.notIn]: ["cancelled"] },
    },
  });
  if (existingAssignment) {
    errors.push(
      `Tài xế ${sub.employee_code} đã được phân công ca khác cùng ngày ${date}.`,
    );
  }

  // ── Unavailability ──
  const unavail = await DriverUnavailability.findOne({
    where: {
      driver_id: sub.id,
      date_from: { [Op.lte]: date },
      date_to: { [Op.gte]: date },
    },
  });
  if (unavail) {
    const u = toPlain(unavail);
    errors.push(
      `Tài xế đang nghỉ (${u.type}): ${u.reason || "không có lý do"}.`,
    );
  }

  // ── License ──
  let vehicleTypeCode = null;
  if (a.vehicle?.vehicle_type_id) {
    const vt = await VehicleType.findByPk(a.vehicle.vehicle_type_id);
    vehicleTypeCode = vt ? toPlain(vt).type_code : null;
  }
  const licCheck = checkLicense(sub, vehicleTypeCode);
  if (!licCheck.valid) errors.push(licCheck.reason);

  // ── 11h rule với X-1 ──
  if (driveStart) {
    const prevDate = addDays(date, -1);
    const prev = await Roster.findOne({
      where: {
        employee_id: sub.id,
        date: prevDate,
        status: { [Op.notIn]: ["off", "absent"] },
      },
      include: [{ model: ShiftTemplate, as: "shift" }],
    });
    if (prev) {
      const p = toPlain(prev);
      if (p.shift) {
        const prevEnd = p.shift.handover_end || p.shift.drive_end;
        const gap = hoursBetween(prevEnd, driveStart);
        if (gap < MIN_REST_HOURS) {
          errors.push(
            `Vi phạm 11h nghỉ với ngày ${prevDate}: chỉ có ${gap.toFixed(1)}h.`,
          );
        }
      }
    }
  }

  // ── 11h rule với X+1 ──
  if (driveEnd) {
    const nextDate = addDays(date, 1);
    const next = await Roster.findOne({
      where: {
        employee_id: sub.id,
        date: nextDate,
        status: { [Op.notIn]: ["off", "absent"] },
      },
      include: [{ model: ShiftTemplate, as: "shift" }],
    });
    if (next) {
      const n = toPlain(next);
      if (n.shift) {
        const gap = hoursBetween(driveEnd, n.shift.drive_start);
        if (gap < MIN_REST_HOURS) {
          errors.push(
            `Vi phạm 11h nghỉ với ngày ${nextDate}: chỉ có ${gap.toFixed(1)}h.`,
          );
        }
      }
    }
  }

  // ── Max hours/tuần ──
  const weekDates = getWeekDates(date);
  const weeklyRosters = await Roster.findAll({
    where: {
      employee_id: sub.id,
      date: { [Op.in]: weekDates },
      status: { [Op.notIn]: ["off", "absent", "swapped"] },
    },
    include: [{ model: ShiftTemplate, as: "shift" }],
  });
  let weeklyHours = 0;
  for (const r of weeklyRosters) {
    const o = toPlain(r);
    if (!o.shift) continue;
    weeklyHours +=
      (timeToSec(o.shift.drive_end) - timeToSec(o.shift.drive_start)) / 3600;
  }
  const newShiftHours =
    driveStart && driveEnd
      ? (timeToSec(driveEnd) - timeToSec(driveStart)) / 3600
      : 0;
  if (weeklyHours + newShiftHours > MAX_HOURS_PER_WEEK) {
    errors.push(
      `Vượt giờ/tuần: hiện có ${weeklyHours.toFixed(1)}h, thêm ${newShiftHours.toFixed(1)}h thành ${(weeklyHours + newShiftHours).toFixed(1)}h (max ${MAX_HOURS_PER_WEEK}h).`,
    );
  }

  return { valid: errors.length === 0, errors, assignment: a, substitute: sub };
}

// ═══════════════════════════════════════════════════════════════
// CREATE — thực hiện swap
// ═══════════════════════════════════════════════════════════════
export async function create(payload = {}) {
  const { assignment_id, substitute_employee_id, reason, requested_by } =
    payload;

  if (!assignment_id || !substitute_employee_id) {
    const err = new Error(
      "assignment_id và substitute_employee_id là bắt buộc.",
    );
    err.status = 400;
    throw err;
  }
  if (!reason || !String(reason).trim()) {
    const err = new Error("reason là bắt buộc.");
    err.status = 400;
    throw err;
  }

  const validation = await validateSwap(
    parseInt(assignment_id),
    parseInt(substitute_employee_id),
  );
  if (!validation.valid) {
    const err = new Error(validation.errors.join(" "));
    err.status = 400;
    err.validation = { errors: validation.errors };
    throw err;
  }

  const a = validation.assignment;
  const sub = validation.substitute;

  const transaction = await sequelize.transaction();
  try {
    // ── 1. Tạo ShiftSwap record ──
    const now = new Date();
    const swap = await ShiftSwap.create(
      {
        original_employee_id: a.employee_id,
        substitute_employee_id: sub.id,
        duty_assignment_id: a.id,
        swap_date: a.date,
        reason: String(reason).trim(),
        requested_by: requested_by ?? 1,
        status: "completed",
        created_at: now,
        completed_at: now,
      },
      { transaction },
    );

    // ── 2. Update DutyAssignment: gán cho tài xế mới ──
    await DutyAssignment.update(
      {
        employee_id: sub.id,
        notes: `Đã swap từ ${a.driver?.employee_code || "N/A"} sang ${sub.employee_code} lúc ${now.toISOString()}. Lý do: ${reason}`,
        updated_at: now,
      },
      { where: { id: a.id }, transaction },
    );

    // ── 3. Update Roster cũ của tài xế A → swapped ──
    const originalRoster = await Roster.findOne({
      where: { employee_id: a.employee_id, date: a.date },
      transaction,
    });
    if (originalRoster) {
      await originalRoster.update(
        {
          status: "swapped",
          notes: `Đã swap sang ${sub.employee_code}. Lý do: ${reason}`,
          updated_at: now,
        },
        { transaction },
      );
    }

    // ── 4. Roster mới cho tài xế B ──
    const substituteRoster = await Roster.findOne({
      where: { employee_id: sub.id, date: a.date },
      transaction,
    });

    if (substituteRoster) {
      // Đã có (thường status='off') → đổi sang scheduled
      await substituteRoster.update(
        {
          status: "scheduled",
          shift_template_id: a.shift_template_id,
          notes: `Thay ca cho ${a.driver?.employee_code || "N/A"}. Lý do: ${reason}`,
          updated_at: now,
        },
        { transaction },
      );
    } else {
      // Tạo mới
      await Roster.create(
        {
          employee_id: sub.id,
          date: a.date,
          shift_template_id: a.shift_template_id,
          depot_id: a.depot_id,
          is_backup: false,
          status: "scheduled",
          notes: `Thay ca cho ${a.driver?.employee_code || "N/A"}. Lý do: ${reason}`,
          created_at: now,
          updated_at: now,
        },
        { transaction },
      );
    }

    await transaction.commit();

    return await getById(swap.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════
export async function getAll({
  from,
  to,
  original_employee_id,
  substitute_employee_id,
  status,
  page = 1,
  limit = 50,
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 50), 200);
  const offset = (page - 1) * limit;

  const where = {};
  if (from && to) where.swap_date = { [Op.between]: [from, to] };
  else if (from) where.swap_date = { [Op.gte]: from };
  else if (to) where.swap_date = { [Op.lte]: to };
  if (original_employee_id) {
    where.original_employee_id = parseInt(original_employee_id);
  }
  if (substitute_employee_id) {
    where.substitute_employee_id = parseInt(substitute_employee_id);
  }
  if (status) where.status = status;

  const { count, rows } = await ShiftSwap.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["swap_date", "DESC"],
      ["id", "DESC"],
    ],
    include: SWAP_INCLUDE,
    distinct: true,
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(formatSwap),
  };
}

// ═══════════════════════════════════════════════════════════════
// GET BY ID
// ═══════════════════════════════════════════════════════════════
export async function getById(id) {
  const s = await ShiftSwap.findByPk(id, { include: SWAP_INCLUDE });
  if (!s) {
    const err = new Error("Không tìm thấy bản ghi swap.");
    err.status = 404;
    throw err;
  }
  return formatSwap(s);
}

// ═══════════════════════════════════════════════════════════════
// GET BY DATE
// ═══════════════════════════════════════════════════════════════
export async function getByDate(date) {
  if (!date) {
    const err = new Error("date là bắt buộc.");
    err.status = 400;
    throw err;
  }

  const rows = await ShiftSwap.findAll({
    where: { swap_date: date },
    order: [["created_at", "DESC"]],
    include: SWAP_INCLUDE,
  });

  return {
    date,
    total: rows.length,
    data: rows.map(formatSwap),
  };
}

// ═══════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════
export async function getStats({ from, to } = {}) {
  const where = {};
  if (from && to) where.swap_date = { [Op.between]: [from, to] };
  else if (from) where.swap_date = { [Op.gte]: from };
  else if (to) where.swap_date = { [Op.lte]: to };

  const total = await ShiftSwap.count({ where });

  // Top tài xế bị swap nhiều nhất
  const byOriginal = await ShiftSwap.findAll({
    attributes: [
      "original_employee_id",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where,
    group: ["original_employee_id"],
    order: [[sequelize.literal("count"), "DESC"]],
    limit: 10,
    raw: true,
  });

  // Top tài xế thay thế nhiều nhất
  const bySubstitute = await ShiftSwap.findAll({
    attributes: [
      "substitute_employee_id",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where,
    group: ["substitute_employee_id"],
    order: [[sequelize.literal("count"), "DESC"]],
    limit: 10,
    raw: true,
  });

  // Load employee info
  const allIds = new Set([
    ...byOriginal.map((r) => r.original_employee_id),
    ...bySubstitute.map((r) => r.substitute_employee_id),
  ]);
  const employees = allIds.size
    ? await Employee.findAll({
        where: { id: { [Op.in]: Array.from(allIds) } },
        attributes: ["id", "employee_code", "full_name"],
      })
    : [];
  const empMap = new Map(employees.map((e) => [e.id, toPlain(e)]));

  return {
    date_range: { from: from || null, to: to || null },
    total_swaps: total,
    top_original_drivers: byOriginal.map((r) => ({
      driver_id: r.original_employee_id,
      employee_code: empMap.get(r.original_employee_id)?.employee_code || null,
      full_name: empMap.get(r.original_employee_id)?.full_name || null,
      swap_count: parseInt(r.count),
    })),
    top_substitute_drivers: bySubstitute.map((r) => ({
      driver_id: r.substitute_employee_id,
      employee_code:
        empMap.get(r.substitute_employee_id)?.employee_code || null,
      full_name: empMap.get(r.substitute_employee_id)?.full_name || null,
      swap_count: parseInt(r.count),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// REMOVE — xóa record (KHÔNG undo swap)
// ═══════════════════════════════════════════════════════════════
export async function remove(id) {
  const s = await ShiftSwap.findByPk(id);
  if (!s) {
    const err = new Error("Không tìm thấy bản ghi swap.");
    err.status = 404;
    throw err;
  }
  await s.destroy();
  return { id: parseInt(id) };
}
