import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Roster from "../models/rosterModel.js";
import ShiftTemplate from "../models/shiftTemplateModel.js";
import Employee from "../models/employeeModel.js";
import { validateRoster } from "../utils/rosterValidator.js";
import {
  getDatesInMonth,
  parseMonth,
  nextMonth,
  isOddMonth,
  getWeekday,
  formatDate,
  addDays,
} from "../utils/dateUtils.js";
import {
  GROUPS,
  splitGroupIntoRoles,
  getShiftForRole,
  getRotationDate,
  isWeeklyOffDay,
  getGroupCeilSide,
} from "../utils/rosterPattern.js";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

function formatRoster(r, { includeRefs = true } = {}) {
  if (!r) return null;
  const o = toPlain(r);
  const base = {
    id: o.id,
    date: o.date,
    employee_id: o.employee_id,
    shift_template_id: o.shift_template_id,
    depot_id: o.depot_id,
    is_backup: o.is_backup,
    status: o.status,
    notes: o.notes,
    created_at: o.created_at,
    updated_at: o.updated_at,
  };
  if (includeRefs) {
    if (o.employee) {
      base.employee = {
        id: o.employee.id,
        employee_code: o.employee.employee_code,
        full_name: o.employee.full_name,
        type: o.employee.type,
      };
    }
    if (o.shift) {
      base.shift = {
        id: o.shift.id,
        code: o.shift.code,
        name: o.shift.name,
        drive_start: String(o.shift.drive_start).slice(0, 5),
        drive_end: String(o.shift.drive_end).slice(0, 5),
      };
    }
  }
  return base;
}

const ROSTER_INCLUDE = [
  {
    model: Employee,
    as: "employee",
    attributes: ["id", "employee_code", "full_name", "type"],
    required: false,
  },
  {
    model: ShiftTemplate,
    as: "shift",
    required: false,
  },
];

// ═══════════════════════════════════════════════════════════════
// LIST — phân trang + filter
// ═══════════════════════════════════════════════════════════════
export async function getAllRosters({
  from,
  to,
  employee_id,
  shift_template_id,
  status,
  depot_id,
  page = 1,
  limit = 100,
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 100), 500);
  const offset = (page - 1) * limit;

  const where = {};
  if (from && to) {
    where.date = { [Op.between]: [from, to] };
  } else if (from) {
    where.date = { [Op.gte]: from };
  } else if (to) {
    where.date = { [Op.lte]: to };
  }
  if (employee_id) where.employee_id = parseInt(employee_id);
  if (shift_template_id) where.shift_template_id = parseInt(shift_template_id);
  if (status) where.status = status;
  if (depot_id) where.depot_id = parseInt(depot_id);

  const { count, rows } = await Roster.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["date", "ASC"],
      ["employee_id", "ASC"],
    ],
    include: ROSTER_INCLUDE,
    distinct: true,
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map((r) => formatRoster(r)),
  };
}

// ═══════════════════════════════════════════════════════════════
// GET BY ID
// ═══════════════════════════════════════════════════════════════
export async function getRosterById(id) {
  const r = await Roster.findByPk(id, { include: ROSTER_INCLUDE });
  if (!r) {
    const err = new Error("Không tìm thấy Roster.");
    err.status = 404;
    throw err;
  }
  return formatRoster(r);
}

// ═══════════════════════════════════════════════════════════════
// GET BY EMPLOYEE
// ═══════════════════════════════════════════════════════════════
export async function getRostersByEmployee(employeeId, { from, to } = {}) {
  const emp = await Employee.findByPk(employeeId);
  if (!emp) {
    const err = new Error("Không tìm thấy nhân viên.");
    err.status = 404;
    throw err;
  }

  const where = { employee_id: parseInt(employeeId) };
  if (from && to) where.date = { [Op.between]: [from, to] };
  else if (from) where.date = { [Op.gte]: from };
  else if (to) where.date = { [Op.lte]: to };

  const rows = await Roster.findAll({
    where,
    order: [["date", "ASC"]],
    include: ROSTER_INCLUDE,
  });

  return {
    employee: {
      id: emp.id,
      employee_code: emp.employee_code,
      full_name: emp.full_name,
    },
    data: rows.map((r) => formatRoster(r)),
  };
}

// ═══════════════════════════════════════════════════════════════
// CREATE — 1 row đơn lẻ
// ═══════════════════════════════════════════════════════════════
export async function createRoster(payload = {}, { force = false } = {}) {
  const {
    employee_id,
    date,
    shift_template_id,
    depot_id,
    status = "scheduled",
    is_backup = false,
    notes,
  } = payload;

  if (!employee_id || !date) {
    const err = new Error("employee_id và date là bắt buộc.");
    err.status = 400;
    throw err;
  }
  if (status !== "off" && status !== "absent" && !shift_template_id) {
    const err = new Error(
      "shift_template_id là bắt buộc trừ khi status là off/absent.",
    );
    err.status = 400;
    throw err;
  }

  // Load employee + shift để validate
  const [employee, shift] = await Promise.all([
    Employee.findByPk(employee_id),
    shift_template_id ? ShiftTemplate.findByPk(shift_template_id) : null,
  ]);

  if (!force) {
    const validation = await validateRoster({
      employee_id,
      date,
      shift_template_id,
      status,
      employee: toPlain(employee),
      shift: toPlain(shift),
    });
    if (!validation.valid) {
      const err = new Error(validation.errors.join(" "));
      err.status = 409;
      err.validation = validation;
      throw err;
    }
  }

  const now = new Date();
  const created = await Roster.create({
    employee_id: parseInt(employee_id),
    date,
    shift_template_id: shift_template_id ? parseInt(shift_template_id) : null,
    depot_id: depot_id ? parseInt(depot_id) : null,
    is_backup: !!is_backup,
    status,
    notes: notes || null,
    created_at: now,
    updated_at: now,
  });

  return getRosterById(created.id);
}

// ═══════════════════════════════════════════════════════════════
// UPDATE — có re-validate 11h với X-1 và X+1
// ═══════════════════════════════════════════════════════════════
export async function updateRoster(id, payload = {}, { force = false } = {}) {
  const existing = await Roster.findByPk(id);
  if (!existing) {
    const err = new Error("Không tìm thấy Roster.");
    err.status = 404;
    throw err;
  }

  const merged = {
    employee_id: payload.employee_id ?? existing.employee_id,
    date: payload.date ?? existing.date,
    shift_template_id:
      payload.shift_template_id !== undefined
        ? payload.shift_template_id
        : existing.shift_template_id,
    depot_id:
      payload.depot_id !== undefined ? payload.depot_id : existing.depot_id,
    status: payload.status ?? existing.status,
    is_backup:
      payload.is_backup !== undefined ? payload.is_backup : existing.is_backup,
    notes: payload.notes !== undefined ? payload.notes : existing.notes,
  };

  const [employee, shift] = await Promise.all([
    Employee.findByPk(merged.employee_id),
    merged.shift_template_id
      ? ShiftTemplate.findByPk(merged.shift_template_id)
      : null,
  ]);

  if (!force) {
    const validation = await validateRoster({
      employee_id: merged.employee_id,
      date: merged.date,
      shift_template_id: merged.shift_template_id,
      status: merged.status,
      exclude_roster_id: id,
      employee: toPlain(employee),
      shift: toPlain(shift),
    });
    if (!validation.valid) {
      const err = new Error(validation.errors.join(" "));
      err.status = 409;
      err.validation = validation;
      throw err;
    }
  }

  await existing.update({
    ...merged,
    updated_at: new Date(),
  });

  return getRosterById(id);
}

// ═══════════════════════════════════════════════════════════════
// CHANGE STATUS
// ═══════════════════════════════════════════════════════════════
export async function changeRosterStatus(id, status) {
  const VALID = [
    "scheduled",
    "working",
    "completed",
    "swapped",
    "absent",
    "off",
  ];
  if (!VALID.includes(status)) {
    const err = new Error(`status phải là một trong: ${VALID.join(", ")}.`);
    err.status = 400;
    throw err;
  }

  const r = await Roster.findByPk(id);
  if (!r) {
    const err = new Error("Không tìm thấy Roster.");
    err.status = 404;
    throw err;
  }

  await r.update({ status, updated_at: new Date() });
  return getRosterById(id);
}

// ═══════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════
export async function deleteRoster(id) {
  const r = await Roster.findByPk(id);
  if (!r) {
    const err = new Error("Không tìm thấy Roster.");
    err.status = 404;
    throw err;
  }
  await r.destroy();
  return { id: parseInt(id) };
}

// ═══════════════════════════════════════════════════════════════
// BULK PLAN BUILDER — dùng chung cho preview + bulk create
// ═══════════════════════════════════════════════════════════════
async function buildBulkPlan(payload = {}) {
  const {
    from_month,
    months_count = 1,
    groups = [], // [{ name: "A", employee_ids: [...] }]
  } = payload;

  // ── Validate inputs ──
  if (!from_month || !/^\d{4}-\d{2}$/.test(from_month)) {
    const err = new Error("from_month phải có định dạng YYYY-MM.");
    err.status = 400;
    throw err;
  }
  const mc = parseInt(months_count);
  if (isNaN(mc) || mc < 1 || mc > 3) {
    const err = new Error("months_count phải trong khoảng 1 - 3.");
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(groups) || groups.length === 0) {
    const err = new Error("groups là bắt buộc và phải là mảng không rỗng.");
    err.status = 400;
    throw err;
  }

  // ── Validate groups ──
  const validGroupNames = Object.keys(GROUPS);
  const seenEmployees = new Set();
  for (const g of groups) {
    if (!validGroupNames.includes(g.name)) {
      const err = new Error(
        `Nhóm "${g.name}" không hợp lệ. Chỉ chấp nhận: ${validGroupNames.join(", ")}.`,
      );
      err.status = 400;
      throw err;
    }
    if (!Array.isArray(g.employee_ids) || g.employee_ids.length === 0) {
      const err = new Error(`Nhóm ${g.name} chưa có employee_ids.`);
      err.status = 400;
      throw err;
    }
    for (const eid of g.employee_ids) {
      if (seenEmployees.has(eid)) {
        const err = new Error(`Employee ${eid} xuất hiện ở nhiều nhóm.`);
        err.status = 400;
        throw err;
      }
      seenEmployees.add(eid);
    }
  }

  // ── Load employees ──
  const allEmployeeIds = [...seenEmployees];
  const employees = await Employee.findAll({
    where: { id: { [Op.in]: allEmployeeIds } },
  });
  const empMap = new Map(employees.map((e) => [e.id, toPlain(e)]));

  const missing = allEmployeeIds.filter((id) => !empMap.has(id));
  if (missing.length > 0) {
    const err = new Error(
      `Không tìm thấy nhân viên có id: ${missing.join(", ")}.`,
    );
    err.status = 404;
    throw err;
  }

  // ── Load shift templates ──
  const shifts = await ShiftTemplate.findAll({ where: { is_active: true } });
  const shiftMap = new Map(shifts.map((s) => [s.code, toPlain(s)]));

  if (!shiftMap.has("MORNING") || !shiftMap.has("EVENING")) {
    const err = new Error(
      "Cần có 2 ca MORNING và EVENING đang active để tạo bulk Roster.",
    );
    err.status = 400;
    throw err;
  }

  // ── Chia mỗi nhóm thành 2 role ──
  const groupRoles = {}; // { A: { role1: [emp], role2: [emp] } }
  for (const g of groups) {
    const empList = g.employee_ids.map((id) => empMap.get(id));
    const ceilSide = getGroupCeilSide(g.name);
    groupRoles[g.name] = splitGroupIntoRoles(empList, ceilSide);
  }

  // ── Build danh sách tháng ──
  const months = [];
  let cur = from_month;
  for (let i = 0; i < mc; i++) {
    months.push(cur);
    cur = nextMonth(cur);
  }

  // ── Sinh rows ──
  const rows = [];
  const rotationEvents = []; // ghi lại các ngày xoay ca để preview

  // Date range
  const firstMonthObj = parseMonth(months[0]);
  const firstMonthDays = getDatesInMonth(
    firstMonthObj.year,
    firstMonthObj.month,
  );
  const dateRangeMin = firstMonthDays[0];

  const lastMonthObj = parseMonth(months[months.length - 1]);
  const lastMonthDays = getDatesInMonth(lastMonthObj.year, lastMonthObj.month);
  const dateRangeMax = lastMonthDays[lastMonthDays.length - 1];

  // ── Loop từng tháng ──
  for (const monthStr of months) {
    const { year, month } = parseMonth(monthStr);
    const dates = getDatesInMonth(year, month);

    for (const g of groups) {
      const groupName = g.name;
      const { role1, role2 } = groupRoles[groupName];

      // Shift ban đầu (đầu tháng, trước ngày xoay)
      const role1StartShift = getShiftForRole(1, monthStr); // MORNING hoặc EVENING
      const role2StartShift = getShiftForRole(2, monthStr);

      // Shift sau ngày xoay (tháng sau đã xoay role)
      const nextMonthStr = nextMonth(monthStr);
      const role1AfterShift = getShiftForRole(1, nextMonthStr);
      const role2AfterShift = getShiftForRole(2, nextMonthStr);

      const rotationDate = getRotationDate(groupName, monthStr);

      // Đăng ký event để preview
      rotationEvents.push({
        month: monthStr,
        group: groupName,
        date: rotationDate,
        count: role1.length + role2.length,
        from_shift: role1StartShift,
        to_shift: role1AfterShift,
        note: `Nhóm ${groupName} xoay role: Role1 ${role1StartShift} → ${role1AfterShift}`,
      });

      // ── Loop từng ngày ──
      for (const dateStr of dates) {
        const isWeeklyOff = getWeekday(dateStr) === GROUPS[groupName].offDay;
        const isRotationDay = dateStr === rotationDate;

        // Xác định shift của mỗi role trong ngày này
        const isAfterRotation = dateStr > rotationDate;
        const role1Shift = isAfterRotation ? role1AfterShift : role1StartShift;
        const role2Shift = isAfterRotation ? role2AfterShift : role2StartShift;

        // ── Nếu là ngày off tuần hoặc ngày xoay → tất cả off ──
        if (isWeeklyOff || isRotationDay) {
          const note = isRotationDay
            ? `Xoay ca nhóm ${groupName} (${role1StartShift} → ${role1AfterShift})`
            : null;

          for (const emp of [...role1, ...role2]) {
            rows.push({
              employee_id: emp.id,
              date: dateStr,
              shift_template_id: null, // off không cần shift
              depot_id: null,
              is_backup: false,
              status: "off",
              notes: note,
            });
          }
          continue;
        }

        // ── Ngày bình thường: gán shift theo role ──
        for (const emp of role1) {
          rows.push({
            employee_id: emp.id,
            date: dateStr,
            shift_template_id: shiftMap.get(role1Shift).id,
            depot_id: null,
            is_backup: false,
            status: "scheduled",
            notes: null,
          });
        }
        for (const emp of role2) {
          rows.push({
            employee_id: emp.id,
            date: dateStr,
            shift_template_id: shiftMap.get(role2Shift).id,
            depot_id: null,
            is_backup: false,
            status: "scheduled",
            notes: null,
          });
        }
      }
    }
  }

  return {
    rows,
    months,
    rotationEvents,
    dateRange: { min: dateRangeMin, max: dateRangeMax },
    empMap,
    shiftMap,
    groups,
    groupRoles,
  };
}

// ═══════════════════════════════════════════════════════════════
// PREVIEW BULK — không lưu, chỉ tính toán
// ═══════════════════════════════════════════════════════════════
export async function previewBulkRoster(payload = {}) {
  const plan = await buildBulkPlan(payload);

  // ── Summary ──
  const byGroup = {};
  for (const g of plan.groups) {
    byGroup[g.name] = plan.rows.filter((r) =>
      g.employee_ids.includes(r.employee_id),
    ).length;
  }

  const byStatus = {};
  for (const r of plan.rows) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }

  // Đếm theo shift
  const byShift = { MORNING: 0, EVENING: 0 };
  const shiftIdToCode = new Map(
    [...plan.shiftMap.entries()].map(([code, s]) => [s.id, code]),
  );
  for (const r of plan.rows) {
    if (r.status === "off" || !r.shift_template_id) continue;
    const code = shiftIdToCode.get(r.shift_template_id);
    if (code) byShift[code]++;
  }

  // ── Check existing ──
  const existingCount = await Roster.count({
    where: {
      date: { [Op.between]: [plan.dateRange.min, plan.dateRange.max] },
      employee_id: {
        [Op.in]: plan.rows.map((r) => r.employee_id),
      },
    },
  });

  // ── Coverage check theo ngày ──
  const coverageMap = {};
  for (const r of plan.rows) {
    if (r.status === "off" || r.status === "absent") continue;
    if (!coverageMap[r.date]) coverageMap[r.date] = { MORNING: 0, EVENING: 0 };
    const code = shiftIdToCode.get(r.shift_template_id);
    if (code) coverageMap[r.date][code]++;
  }

  const coverageSample = Object.entries(coverageMap)
    .sort()
    .slice(0, 10)
    .reduce((acc, [d, c]) => {
      acc[d] = c;
      return acc;
    }, {});

  // ── Boundary 11h check (giống cũ) ──
  const boundaryDate = plan.dateRange.min;
  const prevDate = addDays(boundaryDate, -1);

  const prevBoundaryRosters = await Roster.findAll({
    where: {
      date: prevDate,
      employee_id: { [Op.in]: plan.rows.map((r) => r.employee_id) },
      status: { [Op.notIn]: ["off", "absent"] },
    },
    include: [{ model: ShiftTemplate, as: "shift" }],
  });

  const prevMap = new Map();
  prevBoundaryRosters.forEach((r) => {
    prevMap.set(r.employee_id, toPlain(r));
  });

  const conflicts = [];
  const firstDayRows = plan.rows.filter(
    (r) =>
      r.date === boundaryDate && r.status !== "off" && r.status !== "absent",
  );

  const { hoursBetween, trimTime } = await import("../utils/timeUtils.js");

  for (const row of firstDayRows) {
    const prevRoster = prevMap.get(row.employee_id);
    if (!prevRoster || !prevRoster.shift) continue;

    const prevEnd = prevRoster.shift.handover_end || prevRoster.shift.drive_end;
    const curShift = [...plan.shiftMap.entries()].find(
      ([, s]) => s.id === row.shift_template_id,
    )?.[1];
    if (!curShift) continue;

    const curStart = curShift.drive_start;
    const gap = hoursBetween(prevEnd, curStart);
    if (gap < 11) {
      conflicts.push({
        employee_id: row.employee_id,
        date: row.date,
        prev_date: prevDate,
        prev_end: trimTime(prevEnd),
        cur_start: trimTime(curStart),
        gap_hours: Math.round(gap * 10) / 10,
        reason: `Chỉ có ${gap.toFixed(1)}h nghỉ giữa ca (cần ≥ 11h).`,
      });
    }
  }

  return {
    summary: {
      total_rosters: plan.rows.length,
      months: plan.months,
      date_range: plan.dateRange,
      by_group: byGroup,
      by_status: byStatus,
      by_shift: byShift,
    },
    rotation_events: plan.rotationEvents,
    existing_conflicts: {
      existing_rosters_count: existingCount,
      will_overwrite: existingCount > 0,
      message:
        existingCount > 0
          ? `Có ${existingCount} Roster đã tồn tại trong khoảng này. Bulk create sẽ ghi đè.`
          : "Không có Roster nào trong khoảng này.",
    },
    coverage_sample: coverageSample,
    coverage_warnings: [],
    boundary_11h_conflicts: conflicts,
  };
}

// ═══════════════════════════════════════════════════════════════
// BULK CREATE — commit
// ═══════════════════════════════════════════════════════════════
export async function bulkCreateRoster(
  payload = {},
  { overwrite = false } = {},
) {
  const plan = await buildBulkPlan(payload);

  const existingCount = await Roster.count({
    where: {
      date: { [Op.between]: [plan.dateRange.min, plan.dateRange.max] },
      employee_id: {
        [Op.in]: plan.rows.map((r) => r.employee_id),
      },
    },
  });

  if (existingCount > 0 && !overwrite) {
    const err = new Error(
      `Đã có ${existingCount} Roster trong khoảng ${plan.dateRange.min} → ${plan.dateRange.max}. ` +
        `Chạy lại với overwrite=true để ghi đè.`,
    );
    err.status = 409;
    throw err;
  }

  const now = new Date();
  const rowsToInsert = plan.rows.map((r) => ({
    ...r,
    created_at: now,
    updated_at: now,
  }));

  const transaction = await sequelize.transaction();
  try {
    if (existingCount > 0 && overwrite) {
      await Roster.destroy({
        where: {
          date: { [Op.between]: [plan.dateRange.min, plan.dateRange.max] },
          employee_id: { [Op.in]: plan.rows.map((r) => r.employee_id) },
        },
        transaction,
      });
    }

    const CHUNK = 500;
    let inserted = 0;
    for (let i = 0; i < rowsToInsert.length; i += CHUNK) {
      const chunk = rowsToInsert.slice(i, i + CHUNK);
      await Roster.bulkCreate(chunk, { transaction });
      inserted += chunk.length;
    }

    await transaction.commit();

    return {
      inserted,
      total: rowsToInsert.length,
      overwritten: existingCount,
      date_range: plan.dateRange,
      months: plan.months,
      rotation_events: plan.rotationEvents,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR VIEW — matrix cho FE
// ═══════════════════════════════════════════════════════════════
export async function getCalendar({ month, depot_id } = {}) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const err = new Error("month phải có định dạng YYYY-MM.");
    err.status = 400;
    throw err;
  }

  const { year, month: m } = parseMonth(month);
  const dates = getDatesInMonth(year, m);
  const rangeMin = dates[0];
  const rangeMax = dates[dates.length - 1];

  const where = { date: { [Op.between]: [rangeMin, rangeMax] } };
  if (depot_id) where.depot_id = parseInt(depot_id);

  const rosters = await Roster.findAll({
    where,
    order: [
      ["employee_id", "ASC"],
      ["date", "ASC"],
    ],
    include: ROSTER_INCLUDE,
  });

  // Group theo employee
  const empMap = new Map();
  for (const r of rosters) {
    const o = toPlain(r);
    if (!empMap.has(o.employee_id)) {
      empMap.set(o.employee_id, {
        employee_id: o.employee_id,
        employee_code: o.employee?.employee_code || null,
        full_name: o.employee?.full_name || null,
        cells: {},
      });
    }
    const entry = empMap.get(o.employee_id);
    entry.cells[o.date] = {
      shift_code: o.shift?.code || null,
      status: o.status,
      roster_id: o.id,
    };
  }

  return {
    month,
    dates,
    employees: Array.from(empMap.values()),
  };
}

// ═══════════════════════════════════════════════════════════════
// COVERAGE — số driver mỗi ca mỗi ngày
// ═══════════════════════════════════════════════════════════════
export async function getCoverage({ date, depot_id } = {}) {
  if (!date) {
    const err = new Error("date là bắt buộc.");
    err.status = 400;
    throw err;
  }

  const where = {
    date,
    status: { [Op.notIn]: ["off", "absent"] },
  };
  if (depot_id) where.depot_id = parseInt(depot_id);

  const rosters = await Roster.findAll({
    where,
    include: [{ model: ShiftTemplate, as: "shift" }],
  });

  const byShift = {};
  for (const r of rosters) {
    const o = toPlain(r);
    const code = o.shift?.code || "UNKNOWN";
    if (!byShift[code]) {
      byShift[code] = { assigned: 0, required: 15, drivers: [] };
    }
    byShift[code].assigned++;
    byShift[code].drivers.push({
      employee_id: o.employee_id,
      is_backup: o.is_backup,
    });
  }

  // Bổ sung ca nào chưa có ai
  const allShifts = await ShiftTemplate.findAll({ where: { is_active: true } });
  for (const s of allShifts) {
    const code = s.code;
    if (!byShift[code]) {
      byShift[code] = { assigned: 0, required: 15, drivers: [] };
    }
  }

  // Đánh dấu status
  const alerts = [];
  for (const [code, data] of Object.entries(byShift)) {
    if (data.assigned < data.required) {
      data.status = "warning";
      data.missing = data.required - data.assigned;
      alerts.push(`Thiếu ${data.missing} driver cho ca ${code}.`);
    } else {
      data.status = "ok";
    }
  }

  return {
    date,
    by_shift: byShift,
    alerts,
  };
}

// ═══════════════════════════════════════════════════════════════
// STATS — tổng hợp theo tháng
// ═══════════════════════════════════════════════════════════════
export async function getStats({ month, depot_id } = {}) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const err = new Error("month phải có định dạng YYYY-MM.");
    err.status = 400;
    throw err;
  }

  const { year, month: m } = parseMonth(month);
  const dates = getDatesInMonth(year, m);
  const rangeMin = dates[0];
  const rangeMax = dates[dates.length - 1];

  const where = { date: { [Op.between]: [rangeMin, rangeMax] } };
  if (depot_id) where.depot_id = parseInt(depot_id);

  // Tổng
  const total = await Roster.count({ where });

  // Theo status
  const byStatus = await Roster.findAll({
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where,
    group: ["status"],
    raw: true,
  });

  // Theo shift
  const byShift = await Roster.findAll({
    attributes: [
      "shift_template_id",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where: {
      ...where,
      status: { [Op.notIn]: ["off", "absent"] },
    },
    group: ["shift_template_id"],
    raw: true,
  });

  // Distinct employees
  const distinctEmployees = await Roster.count({
    where,
    distinct: true,
    col: "employee_id",
  });

  // Coverage cảnh báo: đếm ngày thiếu driver mỗi ca
  const dailyCount = await Roster.findAll({
    attributes: [
      "date",
      "shift_template_id",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where: {
      ...where,
      status: { [Op.notIn]: ["off", "absent"] },
    },
    group: ["date", "shift_template_id"],
    raw: true,
  });

  const underCovered = dailyCount.filter((d) => parseInt(d.count) < 15);

  return {
    month,
    date_range: { min: rangeMin, max: rangeMax },
    total,
    distinct_employees: distinctEmployees,
    by_status: byStatus.reduce((acc, r) => {
      acc[r.status] = parseInt(r.count);
      return acc;
    }, {}),
    by_shift: byShift.reduce((acc, r) => {
      acc[r.shift_template_id] = parseInt(r.count);
      return acc;
    }, {}),
    coverage_alerts: {
      total_undercovered_slots: underCovered.length,
      sample: underCovered.slice(0, 10).map((d) => ({
        date: d.date,
        shift_template_id: d.shift_template_id,
        assigned: parseInt(d.count),
      })),
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// SUGGEST PATTERN
// ═══════════════════════════════════════════════════════════════
export async function suggestPatternForDrivers({ total_drivers } = {}) {
  const total = parseInt(total_drivers);
  if (isNaN(total) || total < 4) {
    const err = new Error("total_drivers phải là số >= 4.");
    err.status = 400;
    throw err;
  }

  const perGroup = Math.floor(total / 4);
  const remainder = total % 4;
  const sizes = {
    A: perGroup + (remainder >= 1 ? 1 : 0),
    B: perGroup + (remainder >= 2 ? 1 : 0),
    C: perGroup + (remainder >= 3 ? 1 : 0),
    D: perGroup,
  };

  return {
    total,
    groups: Object.entries(GROUPS).map(([name, cfg]) => {
      const size = sizes[name];
      const role1 = Math.ceil(size / 2);
      const role2 = size - role1;
      return {
        name,
        size,
        role1_size: role1,
        role2_size: role2,
        off_day: cfg.offDay,
        off_day_label: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][cfg.offDay],
      };
    }),
  };
}
