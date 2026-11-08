import { Op } from "sequelize";
import sequelize from "../config/database.js";
import DriverUnavailability from "../models/driverUnavailabilityModel.js";
import Employee from "../models/employeeModel.js";
import Roster from "../models/rosterModel.js";
import DutyAssignment from "../models/dutyAssignmentModel.js";
import ShiftTemplate from "../models/shiftTemplateModel.js";
import { trimTime } from "../utils/timeUtils.js";

const VALID_TYPES = ["sick", "personal", "vacation", "training", "suspended"];

const TYPE_LABELS = {
  sick: "Nghỉ ốm",
  personal: "Việc riêng",
  vacation: "Nghỉ phép",
  training: "Đào tạo",
  suspended: "Đình chỉ",
};

function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

function formatUnavailability(r) {
  if (!r) return null;
  const o = toPlain(r);
  return {
    id: o.id,
    driver_id: o.driver_id,
    driver: o.driver
      ? {
          id: o.driver.id,
          employee_code: o.driver.employee_code,
          full_name: o.driver.full_name,
        }
      : null,
    date_from: o.date_from,
    date_to: o.date_to,
    type: o.type,
    type_label: TYPE_LABELS[o.type] || o.type,
    reason: o.reason,
    reported_by: o.reported_by,
    created_at: o.created_at,
  };
}

function daysBetween(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  return Math.floor((b - a) / (24 * 3600 * 1000)) + 1;
}

async function validatePayload(
  payload,
  { excludeId = null, requireAll = true } = {},
) {
  const errors = [];
  const warnings = [];

  if (requireAll || payload.driver_id !== undefined) {
    if (!payload.driver_id) errors.push("driver_id là bắt buộc.");
  }
  if (requireAll || payload.date_from !== undefined) {
    if (!payload.date_from) errors.push("date_from là bắt buộc.");
  }
  if (requireAll || payload.date_to !== undefined) {
    if (!payload.date_to) errors.push("date_to là bắt buộc.");
  }
  if (requireAll || payload.type !== undefined) {
    if (!payload.type) errors.push("type là bắt buộc.");
    else if (!VALID_TYPES.includes(payload.type)) {
      errors.push(`type phải là một trong: ${VALID_TYPES.join(", ")}.`);
    }
  }

  if (errors.length > 0) return { valid: false, errors, warnings };

  if (payload.date_from > payload.date_to) {
    errors.push("date_from phải nhỏ hơn hoặc bằng date_to.");
  }

  const driver = await Employee.findByPk(payload.driver_id);
  if (!driver) {
    errors.push("Không tìm thấy nhân viên.");
  } else {
    if (driver.type !== "driver") {
      errors.push(`Nhân viên ${driver.employee_code} không phải tài xế.`);
    }
    if (!driver.is_active) {
      warnings.push(
        `Tài xế ${driver.employee_code} đang ngưng hoạt động. Vẫn ghi nhận nghỉ.`,
      );
    }
  }

  if (errors.length > 0) return { valid: false, errors, warnings };

  const overlapWhere = {
    driver_id: payload.driver_id,
    [Op.or]: [
      { date_from: { [Op.between]: [payload.date_from, payload.date_to] } },
      { date_to: { [Op.between]: [payload.date_from, payload.date_to] } },
      {
        [Op.and]: [
          { date_from: { [Op.lte]: payload.date_from } },
          { date_to: { [Op.gte]: payload.date_to } },
        ],
      },
    ],
  };
  if (excludeId) overlapWhere.id = { [Op.ne]: excludeId };

  const overlap = await DriverUnavailability.findOne({ where: overlapWhere });
  if (overlap) {
    errors.push(
      `Đã có ghi nhận nghỉ từ ${overlap.date_from} đến ${overlap.date_to} (loại: ${
        TYPE_LABELS[overlap.type] || overlap.type
      }).`,
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════
export async function getAll({
  driver_id,
  from,
  to,
  type,
  page = 1,
  limit = 20,
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;

  const where = {};
  if (driver_id) where.driver_id = parseInt(driver_id);
  if (type) where.type = type;
  if (from) where.date_to = { ...(where.date_to || {}), [Op.gte]: from };
  if (to) where.date_from = { ...(where.date_from || {}), [Op.lte]: to };

  const { count, rows } = await DriverUnavailability.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["date_from", "DESC"],
      ["id", "DESC"],
    ],
    include: [
      {
        model: Employee,
        as: "driver",
        attributes: ["id", "employee_code", "full_name"],
        required: false,
      },
    ],
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(formatUnavailability),
  };
}

// ═══════════════════════════════════════════════════════════════
// GET BY ID
// ═══════════════════════════════════════════════════════════════
export async function getById(id) {
  const r = await DriverUnavailability.findByPk(id, {
    include: [
      {
        model: Employee,
        as: "driver",
        attributes: ["id", "employee_code", "full_name"],
        required: false,
      },
    ],
  });
  if (!r) {
    const err = new Error("Không tìm thấy ghi nhận nghỉ.");
    err.status = 404;
    throw err;
  }
  return formatUnavailability(r);
}

// ═══════════════════════════════════════════════════════════════
// HELPER — check 1 driver có nghỉ vào ngày X không
// ═══════════════════════════════════════════════════════════════
export async function checkDriverAvailability(driverId, date) {
  if (!driverId || !date) {
    const err = new Error("driver_id và date là bắt buộc.");
    err.status = 400;
    throw err;
  }

  const record = await DriverUnavailability.findOne({
    where: {
      driver_id: parseInt(driverId),
      date_from: { [Op.lte]: date },
      date_to: { [Op.gte]: date },
    },
    include: [
      {
        model: Employee,
        as: "driver",
        attributes: ["id", "employee_code", "full_name"],
        required: false,
      },
    ],
  });

  return {
    driver_id: parseInt(driverId),
    date,
    is_unavailable: !!record,
    record: record ? formatUnavailability(record) : null,
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER — check trong 1 range ngày, trả về list ngày nghỉ
// ═══════════════════════════════════════════════════════════════
export async function checkDriverRange(driverId, from, to) {
  if (!driverId || !from || !to) {
    const err = new Error("driver_id, from, to là bắt buộc.");
    err.status = 400;
    throw err;
  }
  if (from > to) {
    const err = new Error("from phải nhỏ hơn hoặc bằng to.");
    err.status = 400;
    throw err;
  }

  const records = await DriverUnavailability.findAll({
    where: {
      driver_id: parseInt(driverId),
      date_from: { [Op.lte]: to },
      date_to: { [Op.gte]: from },
    },
    order: [["date_from", "ASC"]],
  });

  // Trải từng record thành từng ngày (đơn giản, không phức tạp)
  const unavailableDates = new Set();
  for (const r of records) {
    const o = toPlain(r);
    const start = new Date(o.date_from);
    const end = new Date(o.date_to);
    const rangeStart = new Date(from);
    const rangeEnd = new Date(to);

    const realStart = start > rangeStart ? start : rangeStart;
    const realEnd = end < rangeEnd ? end : rangeEnd;

    for (
      let d = new Date(realStart);
      d <= realEnd;
      d.setDate(d.getDate() + 1)
    ) {
      const p = (n) => String(n).padStart(2, "0");
      unavailableDates.add(
        `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
      );
    }
  }

  return {
    driver_id: parseInt(driverId),
    from,
    to,
    total_days: unavailableDates.size,
    unavailable_dates: Array.from(unavailableDates).sort(),
    records: records.map(formatUnavailability),
  };
}

// ═══════════════════════════════════════════════════════════════
// IMPACT — đếm Roster/Assignment bị ảnh hưởng
// ═══════════════════════════════════════════════════════════════
export async function getImpact({ driver_id, from, to } = {}) {
  if (!driver_id || !from || !to) {
    const err = new Error("driver_id, from, to là bắt buộc.");
    err.status = 400;
    throw err;
  }
  if (from > to) {
    const err = new Error("from phải nhỏ hơn hoặc bằng to.");
    err.status = 400;
    throw err;
  }

  const [affectedRosters, affectedAssignments] = await Promise.all([
    Roster.findAll({
      where: {
        employee_id: parseInt(driver_id),
        date: { [Op.between]: [from, to] },
        status: { [Op.notIn]: ["off", "absent"] },
      },
      include: [{ model: ShiftTemplate, as: "shift", required: false }],
      order: [["date", "ASC"]],
    }),
    DutyAssignment.findAll({
      where: {
        employee_id: parseInt(driver_id),
        date: { [Op.between]: [from, to] },
        status: { [Op.notIn]: ["cancelled"] },
      },
      order: [["date", "ASC"]],
    }),
  ]);

  return {
    driver_id: parseInt(driver_id),
    from,
    to,
    affected_rosters: affectedRosters.length,
    affected_assignments: affectedAssignments.length,
    sample_rosters: affectedRosters.slice(0, 10).map((r) => {
      const o = toPlain(r);
      return {
        id: o.id,
        date: o.date,
        shift_code: o.shift?.code || null,
        shift_name: o.shift?.name || null,
        status: o.status,
      };
    }),
    sample_assignments: affectedAssignments.slice(0, 10).map((a) => {
      const o = toPlain(a);
      return {
        id: o.id,
        date: o.date,
        route_id: o.route_id,
        vehicle_id: o.vehicle_id,
        start_time: trimTime(o.start_time),
        end_time: trimTime(o.end_time),
        status: o.status,
      };
    }),
  };
}

// ═══════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════
export async function create(payload = {}) {
  const validation = await validatePayload(payload, { requireAll: true });
  if (!validation.valid) {
    const err = new Error(validation.errors.join(" "));
    err.status = 400;
    err.validation = validation;
    throw err;
  }

  const created = await DriverUnavailability.create({
    driver_id: parseInt(payload.driver_id),
    date_from: payload.date_from,
    date_to: payload.date_to,
    type: payload.type,
    reason: payload.reason || null,
    reported_by: payload.reported_by ?? 1,
    created_at: new Date(),
  });

  const data = await getById(created.id);
  const impact = await getImpact({
    driver_id: payload.driver_id,
    from: payload.date_from,
    to: payload.date_to,
  });

  const warnings = [...validation.warnings];
  if (impact.affected_rosters > 0 || impact.affected_assignments > 0) {
    warnings.push(
      `Tài xế có ${impact.affected_rosters} Roster và ${impact.affected_assignments} phân công trong khoảng này. Cần xử lý riêng.`,
    );
  }

  return { data, warnings, impact };
}

// ═══════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════
export async function update(id, payload = {}) {
  const existing = await DriverUnavailability.findByPk(id);
  if (!existing) {
    const err = new Error("Không tìm thấy ghi nhận nghỉ.");
    err.status = 404;
    throw err;
  }

  // Merge payload vào existing để validate
  const merged = {
    driver_id:
      payload.driver_id !== undefined ? payload.driver_id : existing.driver_id,
    date_from:
      payload.date_from !== undefined ? payload.date_from : existing.date_from,
    date_to: payload.date_to !== undefined ? payload.date_to : existing.date_to,
    type: payload.type !== undefined ? payload.type : existing.type,
  };

  const validation = await validatePayload(merged, {
    excludeId: id,
    requireAll: true,
  });
  if (!validation.valid) {
    const err = new Error(validation.errors.join(" "));
    err.status = 400;
    err.validation = validation;
    throw err;
  }

  // Chuẩn bị updates
  const updates = {};
  if (payload.date_from !== undefined) updates.date_from = payload.date_from;
  if (payload.date_to !== undefined) updates.date_to = payload.date_to;
  if (payload.type !== undefined) updates.type = payload.type;
  if (payload.reason !== undefined) updates.reason = payload.reason || null;

  if (Object.keys(updates).length === 0) {
    const err = new Error("Không có trường nào để cập nhật.");
    err.status = 400;
    throw err;
  }

  await existing.update(updates);

  const data = await getById(id);
  const impact = await getImpact({
    driver_id: merged.driver_id,
    from: merged.date_from,
    to: merged.date_to,
  });

  return { data, warnings: validation.warnings, impact };
}

// ═══════════════════════════════════════════════════════════════
// REMOVE — hard delete
// ═══════════════════════════════════════════════════════════════
export async function remove(id) {
  const r = await DriverUnavailability.findByPk(id);
  if (!r) {
    const err = new Error("Không tìm thấy ghi nhận nghỉ.");
    err.status = 404;
    throw err;
  }
  const o = toPlain(r);
  await r.destroy();
  return {
    id: parseInt(id),
    driver_id: o.driver_id,
    date_from: o.date_from,
    date_to: o.date_to,
  };
}

// ═══════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════
export async function getStats({ from, to, type } = {}) {
  const where = {};
  if (type) where.type = type;
  if (from) where.date_to = { [Op.gte]: from };
  if (to) where.date_from = { [Op.lte]: to };

  const records = await DriverUnavailability.findAll({
    where,
    order: [["date_from", "ASC"]],
  });

  // ── Tổng ──
  const totalRecords = records.length;

  // ── Tổng ngày nghỉ (sum days, có thể trùng nếu range chồng — nhưng validate đã chặn) ──
  let totalDays = 0;
  for (const r of records) {
    totalDays += daysBetween(toPlain(r).date_from, toPlain(r).date_to);
  }

  // ── Theo type ──
  const byType = {};
  for (const t of VALID_TYPES) byType[t] = 0;
  for (const r of records) {
    byType[toPlain(r).type] = (byType[toPlain(r).type] || 0) + 1;
  }

  // ── Theo driver ──
  const byDriverMap = new Map();
  for (const r of records) {
    const o = toPlain(r);
    const days = daysBetween(o.date_from, o.date_to);
    if (!byDriverMap.has(o.driver_id)) {
      byDriverMap.set(o.driver_id, {
        driver_id: o.driver_id,
        days_off: 0,
        records: 0,
      });
    }
    const entry = byDriverMap.get(o.driver_id);
    entry.days_off += days;
    entry.records += 1;
  }

  // Load tên driver
  const driverIds = Array.from(byDriverMap.keys());
  const drivers = driverIds.length
    ? await Employee.findAll({
        where: { id: { [Op.in]: driverIds } },
        attributes: ["id", "employee_code", "full_name"],
      })
    : [];
  const driverMap = new Map(drivers.map((d) => [d.id, toPlain(d)]));

  const byDriver = Array.from(byDriverMap.values())
    .map((e) => {
      const d = driverMap.get(e.driver_id);
      return {
        driver_id: e.driver_id,
        employee_code: d?.employee_code || null,
        full_name: d?.full_name || null,
        days_off: e.days_off,
        records: e.records,
      };
    })
    .sort((a, b) => b.days_off - a.days_off);

  return {
    date_range: {
      from: from || null,
      to: to || null,
    },
    total_records: totalRecords,
    total_days_off: totalDays,
    by_type: byType,
    by_driver: byDriver,
    top_absent: byDriver.slice(0, 5),
  };
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR — matrix driver × ngày cho 1 tháng
// ═══════════════════════════════════════════════════════════════
export async function getCalendar({ month, driver_id } = {}) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const err = new Error("month phải có định dạng YYYY-MM.");
    err.status = 400;
    throw err;
  }

  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const p = (n) => String(n).padStart(2, "0");
  const dates = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${year}-${p(m)}-${p(d)}`);
  }
  const rangeMin = dates[0];
  const rangeMax = dates[dates.length - 1];

  const where = {
    date_from: { [Op.lte]: rangeMax },
    date_to: { [Op.gte]: rangeMin },
  };
  if (driver_id) where.driver_id = parseInt(driver_id);

  const records = await DriverUnavailability.findAll({
    where,
    include: [
      {
        model: Employee,
        as: "driver",
        attributes: ["id", "employee_code", "full_name"],
        required: false,
      },
    ],
  });

  // Group theo driver
  const empMap = new Map();
  for (const r of records) {
    const o = toPlain(r);
    if (!empMap.has(o.driver_id)) {
      empMap.set(o.driver_id, {
        driver_id: o.driver_id,
        employee_code: o.driver?.employee_code || null,
        full_name: o.driver?.full_name || null,
        cells: {},
      });
    }
    const entry = empMap.get(o.driver_id);

    // Trải từng ngày trong range giao với tháng
    const start = new Date(o.date_from);
    const end = new Date(o.date_to);
    const monthStart = new Date(rangeMin);
    const monthEnd = new Date(rangeMax);

    const realStart = start > monthStart ? start : monthStart;
    const realEnd = end < monthEnd ? end : monthEnd;

    for (
      let d = new Date(realStart);
      d <= realEnd;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      entry.cells[dateStr] = {
        type: o.type,
        type_label: TYPE_LABELS[o.type] || o.type,
        record_id: o.id,
      };
    }
  }

  return {
    month,
    dates,
    drivers: Array.from(empMap.values()),
  };
}
