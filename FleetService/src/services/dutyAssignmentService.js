import { Op } from "sequelize";
import sequelize from "../config/database.js";
import DutyAssignment from "../models/dutyAssignmentModel.js";
import Employee from "../models/employeeModel.js";
import Vehicle from "../models/vehicleModel.js";
import ShiftTemplate from "../models/shiftTemplateModel.js";
import Roster from "../models/rosterModel.js";
import DriverUnavailability from "../models/driverUnavailabilityModel.js";
import {
  fetchTripsByRouteAndDate,
  fetchRouteStats,
} from "../utils/routeServiceClient.js";
import {
  timeToSec,
  secToTimeShort,
  getTripEndSec,
  isTripWithinShift,
  computeBlockDurationSec,
} from "../utils/tripTimeUtils.js";

const DEFAULT_BUFFER_MINUTES = 45;
const MIN_BUFFER_MINUTES = 30;
const MAX_BUFFER_MINUTES = 90;

function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

function formatAssignment(a) {
  if (!a) return null;
  const o = toPlain(a);
  return {
    id: o.id,
    date: o.date,
    shift_template_id: o.shift_template_id,
    shift: o.shift
      ? {
          id: o.shift.id,
          code: o.shift.code,
          name: o.shift.name,
          drive_start: String(o.shift.drive_start).slice(0, 5),
          drive_end: String(o.shift.drive_end).slice(0, 5),
        }
      : null,
    employee_id: o.employee_id,
    driver: o.driver
      ? {
          id: o.driver.id,
          employee_code: o.driver.employee_code,
          full_name: o.driver.full_name,
        }
      : null,
    co_driver_id: o.co_driver_id,
    co_driver: o.co_driver
      ? {
          id: o.co_driver.id,
          employee_code: o.co_driver.employee_code,
          full_name: o.co_driver.full_name,
        }
      : null,
    vehicle_id: o.vehicle_id,
    vehicle: o.vehicle
      ? {
          id: o.vehicle.id,
          vehicle_code: o.vehicle.vehicle_code,
          license_plate: o.vehicle.license_plate,
        }
      : null,
    route_id: o.route_id,
    depot_id: o.depot_id,
    start_time: secToTimeShort(timeToSec(o.start_time)),
    end_time: secToTimeShort(timeToSec(o.end_time)),
    buffer_minutes: o.buffer_minutes,
    status: o.status,
    notes: o.notes,
    created_at: o.created_at,
    updated_at: o.updated_at,
  };
}

const ASSIGNMENT_INCLUDE = [
  {
    model: Employee,
    as: "driver",
    attributes: ["id", "employee_code", "full_name"],
    required: false,
  },
  {
    model: Employee,
    as: "co_driver",
    attributes: ["id", "employee_code", "full_name"],
    required: false,
  },
  {
    model: Vehicle,
    as: "vehicle",
    attributes: ["id", "vehicle_code", "license_plate", "depot_id"],
    required: false,
  },
  { model: ShiftTemplate, as: "shift", required: false },
];

// ═══════════════════════════════════════════════════════════════
// GREEDY BLOCK SPLITTER
// Chia trips thành các block sao cho mỗi block chạy liên tục
// với buffer giữa các trip
// ═══════════════════════════════════════════════════════════════
/**
 * @param {Array} trips - danh sách trip đã filter + sort
 * @param {number} bufferSec - buffer giữa 2 trip (giây)
 * @returns {Array} - [{ trips: [...], start_sec, end_sec, duration_sec }]
 */
// ═══════════════════════════════════════════════════════════════
// SPLIT TRIPS → BLOCKS — ghép cặp GO/RET thành round-trip
// ═══════════════════════════════════════════════════════════════
function splitTripsIntoBlocks(trips, bufferSec, driveEndTime) {
  const DWELL_SEC = 5 * 60; // 5 phút dừng tại bến cuối

  // ── Tách GO và RET, sort theo start_time ──
  const goTrips = trips
    .filter((t) => t.trip_id.includes("_GO_"))
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

  const retTrips = trips
    .filter((t) => t.trip_id.includes("_RET_"))
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

  // ── Ghép cặp GO[i] + RET[i] ──
  const roundTrips = [];
  const pairCount = Math.min(goTrips.length, retTrips.length);

  for (let i = 0; i < pairCount; i++) {
    const go = goTrips[i];
    const ret = retTrips[i];

    const goStart = timeToSec(go.start_time);
    const goTravel = go.travel_time_sec || 60 * 60;
    const goEnd = goStart + goTravel;

    // RET bắt đầu ngay sau khi GO kết thúc + dwell
    const retStart = goEnd + DWELL_SEC;
    const retTravel = ret.travel_time_sec || 60 * 60;
    const retEnd = retStart + retTravel;

    roundTrips.push({
      go,
      ret,
      go_start_sec: goStart,
      go_end_sec: goEnd,
      ret_start_sec: retStart,
      ret_end_sec: retEnd,
      start_sec: goStart,
      end_sec: retEnd,
    });
  }

  // ── Greedy chia vòng vào blocks ──
  const driveEndSec = driveEndTime ? timeToSec(driveEndTime) : 24 * 3600;
  const blocks = [];

  for (const rt of roundTrips) {
    // Bỏ qua vòng vượt khỏi ca
    if (rt.end_sec > driveEndSec) continue;

    let assigned = null;
    for (const b of blocks) {
      const gap = rt.start_sec - b.last_end_sec;
      if (gap >= bufferSec) {
        assigned = b;
        break;
      }
    }

    if (assigned) {
      assigned.rounds.push(rt);
      assigned.last_end_sec = rt.end_sec;
    } else {
      blocks.push({
        rounds: [rt],
        first_start_sec: rt.start_sec,
        last_end_sec: rt.end_sec,
      });
    }
  }

  // ── Map sang format cũ ──
  return blocks.map((b) => {
    const tripsInBlock = [];
    b.rounds.forEach((rt) => {
      tripsInBlock.push(rt.go);
      tripsInBlock.push(rt.ret);
    });

    return {
      trips: tripsInBlock,
      trip_count: tripsInBlock.length,
      start_sec: b.first_start_sec,
      end_sec: b.last_end_sec,
      duration_sec: b.last_end_sec - b.first_start_sec,
      start_time: secToTimeShort(b.first_start_sec),
      end_time: secToTimeShort(b.last_end_sec),
      trip_ids: tripsInBlock.map((t) => t.id),
      trip_codes: tripsInBlock.map((t) => t.trip_id),
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// SUGGEST BLOCKS
// ═══════════════════════════════════════════════════════════════
/**
 * Gợi ý chia blocks cho 1 ngày + tuyến + ca
 * @param {object} params
 * @param {string} params.date - "YYYY-MM-DD"
 * @param {number} params.route_id
 * @param {number} params.shift_template_id
 * @param {number} params.depot_id
 * @param {number} [params.buffer_minutes] - override buffer (default 45)
 */
export async function suggestBlocks({
  date,
  route_id,
  shift_template_id,
  depot_id,
  buffer_minutes,
} = {}) {
  // ── Validate input ──
  if (!date || !route_id || !shift_template_id || !depot_id) {
    const err = new Error(
      "date, route_id, shift_template_id, depot_id là bắt buộc.",
    );
    err.status = 400;
    throw err;
  }

  const buffer = parseInt(buffer_minutes) || DEFAULT_BUFFER_MINUTES;
  if (buffer < MIN_BUFFER_MINUTES || buffer > MAX_BUFFER_MINUTES) {
    const err = new Error(
      `buffer_minutes phải trong khoảng ${MIN_BUFFER_MINUTES} - ${MAX_BUFFER_MINUTES}.`,
    );
    err.status = 400;
    throw err;
  }

  // ── Load shift template ──
  const shift = await ShiftTemplate.findByPk(shift_template_id);
  if (!shift) {
    const err = new Error("Không tìm thấy ca làm việc.");
    err.status = 404;
    throw err;
  }
  const shiftPlain = toPlain(shift);
  const driveStart = shiftPlain.drive_start;
  const driveEnd = shiftPlain.drive_end;

  // ── Lấy trips từ RouteService ──
  const tripsResult = await fetchTripsByRouteAndDate(route_id, date);
  const allTrips = tripsResult.data || [];

  if (allTrips.length === 0) {
    return {
      date,
      route_id,
      shift_template_id,
      depot_id,
      buffer_minutes: buffer,
      drive_window: {
        start: driveStart.slice(0, 5),
        end: driveEnd.slice(0, 5),
      },
      total_trips_in_shift: 0,
      suggested_blocks: [],
      warnings: ["Không có chuyến nào trong ngày này."],
    };
  }

  // ── Filter trips trong ca ──
  const shiftTrips = allTrips.filter((t) =>
    isTripWithinShift(t, driveStart, driveEnd),
  );

  if (shiftTrips.length === 0) {
    return {
      date,
      route_id,
      shift_template_id,
      depot_id,
      buffer_minutes: buffer,
      drive_window: {
        start: driveStart.slice(0, 5),
        end: driveEnd.slice(0, 5),
      },
      total_trips_in_shift: 0,
      suggested_blocks: [],
      warnings: [
        `Không có chuyến nào trong ca ${shiftPlain.name}. ` +
          `Có ${allTrips.length} chuyến trong ngày nhưng đều ngoài khung giờ ca.`,
      ],
    };
  }

  // ── Chia thành blocks ──
  const bufferSec = buffer * 60;
  const blocks = splitTripsIntoBlocks(shiftTrips, bufferSec, driveEnd);

  // ── Load used IDs ban đầu ──
  const usedVehicleIds = new Set(await getUsedVehicleIds(date));
  const usedDriverIds = new Set(await getUsedDriverIds(date));
  const usedCoDriverIds = new Set(await getUsedCoDriverIds(date));

  // ── Gợi ý tuần tự, track used ──
  const suggested = [];
  for (const block of blocks) {
    const result = await suggestRefsForBlock(block, {
      date,
      depot_id,
      shift_template_id,
      usedVehicleIds,
      usedDriverIds,
      usedCoDriverIds,
    });

    if (result.suggested_vehicle?.id) {
      usedVehicleIds.add(result.suggested_vehicle.id);
    }
    if (result.suggested_driver?.id) {
      usedDriverIds.add(result.suggested_driver.id);
    }
    if (result.suggested_co_driver?.id) {
      usedCoDriverIds.add(result.suggested_co_driver.id);
    }

    suggested.push(result);
  }

  // ── Warnings: bus bunching ──
  const warnings = [];
  for (let i = 1; i < suggested.length; i++) {
    const prev = suggested[i - 1];
    const cur = suggested[i];
    const overlap =
      Math.min(timeToSec(prev.end_time), timeToSec(cur.end_time)) -
      Math.max(timeToSec(prev.start_time), timeToSec(cur.start_time));
    if (overlap > 0 && overlap < 30 * 60) {
      warnings.push(
        `Block ${i} và Block ${i + 1} cùng tuyến, sẽ chạy trong khoảng ${Math.round(
          overlap / 60,
        )}p cùng lúc (bus bunching).`,
      );
    }
  }

  return {
    date,
    route_id,
    shift_template_id,
    depot_id,
    buffer_minutes: buffer,
    drive_window: {
      start: driveStart.slice(0, 5),
      end: driveEnd.slice(0, 5),
    },
    total_trips_in_shift: shiftTrips.length,
    suggested_blocks: suggested,
    warnings,
  };
}

async function suggestRefsForBlock(
  block,
  {
    date,
    depot_id,
    shift_template_id,
    usedVehicleIds,
    usedDriverIds,
    usedCoDriverIds,
  },
) {
  // ── 1. Xe — trong depot, active, chưa dùng ──
  const vehicleCandidates = await Vehicle.findAll({
    where: {
      depot_id: parseInt(depot_id),
      is_active: true,
      id: { [Op.notIn]: Array.from(usedVehicleIds) },
    },
    order: [["id", "ASC"]],
  });
  const suggestedVehicle = vehicleCandidates[0] || null;

  // ── 2. Driver — có Roster ngày đó, shift khớp, chưa dùng ──
  const driverCandidates = await findAvailableDrivers(
    date,
    shift_template_id,
    Array.from(usedDriverIds),
  );
  const suggestedDriver = driverCandidates[0] || null;

  // ── 3. Lơ xe — chưa dùng ──
  const coDrivers = await Employee.findAll({
    where: {
      type: "co_driver",
      is_active: true,
      id: { [Op.notIn]: Array.from(usedCoDriverIds) },
    },
    order: [["id", "ASC"]],
  });
  const suggestedCoDriver =
    coDrivers.length > 0
      ? coDrivers[Math.floor(Math.random() * coDrivers.length)]
      : null;

  // ── Warnings ──
  const warnings = [];
  if (!suggestedVehicle) {
    warnings.push(
      usedVehicleIds.size > 0
        ? "Đã dùng hết xe khả dụng của depot."
        : `Không có xe nào trong depot #${depot_id}.`,
    );
  }
  if (!suggestedDriver) {
    warnings.push(
      usedDriverIds.size > 0
        ? "Đã dùng hết tài xế khả dụng."
        : "Không có tài xế nào rảnh trong ca này.",
    );
  }

  return {
    block_index: null,
    start_time: block.start_time,
    end_time: block.end_time,
    duration_minutes: Math.round(block.duration_sec / 60),
    trip_count: block.trip_count,
    trip_codes: block.trip_codes,
    suggested_vehicle: suggestedVehicle
      ? {
          id: suggestedVehicle.id,
          vehicle_code: suggestedVehicle.vehicle_code,
          license_plate: suggestedVehicle.license_plate,
        }
      : null,
    suggested_driver: suggestedDriver
      ? {
          id: suggestedDriver.id,
          employee_code: suggestedDriver.employee_code,
          full_name: suggestedDriver.full_name,
        }
      : null,
    suggested_co_driver: suggestedCoDriver
      ? {
          id: suggestedCoDriver.id,
          employee_code: suggestedCoDriver.employee_code,
          full_name: suggestedCoDriver.full_name,
        }
      : null,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// Helper: tìm tập ID đã dùng
// ═══════════════════════════════════════════════════════════════
async function getUsedVehicleIds(date) {
  const rows = await DutyAssignment.findAll({
    where: {
      date,
      status: { [Op.notIn]: ["cancelled"] },
    },
    attributes: ["vehicle_id"],
    raw: true,
  });
  return rows.map((r) => r.vehicle_id).filter(Boolean);
}

async function getUsedDriverIds(date) {
  const rows = await DutyAssignment.findAll({
    where: {
      date,
      status: { [Op.notIn]: ["cancelled"] },
    },
    attributes: ["employee_id"],
    raw: true,
  });
  return rows.map((r) => r.employee_id).filter(Boolean);
}

async function getUsedCoDriverIds(date) {
  const rows = await DutyAssignment.findAll({
    where: {
      date,
      status: { [Op.notIn]: ["cancelled"] },
      co_driver_id: { [Op.ne]: null },
    },
    attributes: ["co_driver_id"],
    raw: true,
  });
  return rows.map((r) => r.co_driver_id).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════
// Helper: tìm driver khả dụng
// ── Có Roster cùng ngày + shift khớp
// ── Không có unavailability
// ── Chưa bị gán DutyAssignment cùng ngày
// ═══════════════════════════════════════════════════════════════
async function findAvailableDrivers(date, shiftTemplateId, excludeIds = []) {
  // Roster cùng ngày + shift khớp
  const rosters = await Roster.findAll({
    where: {
      date,
      shift_template_id: shiftTemplateId,
      status: "scheduled",
      employee_id: { [Op.notIn]: excludeIds },
    },
    attributes: ["employee_id"],
    raw: true,
  });
  const rosterEmployeeIds = rosters.map((r) => r.employee_id).filter(Boolean);

  if (rosterEmployeeIds.length === 0) return [];

  // Filter unavailability
  const unavailable = await DriverUnavailability.findAll({
    where: {
      driver_id: { [Op.in]: rosterEmployeeIds },
      date_from: { [Op.lte]: date },
      date_to: { [Op.gte]: date },
    },
    attributes: ["driver_id"],
    raw: true,
  });
  const unavailableIds = new Set(unavailable.map((u) => u.driver_id));

  const candidates = rosterEmployeeIds.filter((id) => !unavailableIds.has(id));

  if (candidates.length === 0) return [];

  // Load full employee
  const employees = await Employee.findAll({
    where: {
      id: { [Op.in]: candidates },
      type: "driver",
      is_active: true,
    },
    order: [["id", "ASC"]],
  });

  return employees;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATE ASSIGNMENT — dùng chung cho create / update / bulk
// ═══════════════════════════════════════════════════════════════
async function validateAssignment(payload, { excludeId = null } = {}) {
  const errors = [];

  // ── Required ──
  const required = [
    "date",
    "shift_template_id",
    "employee_id",
    "vehicle_id",
    "route_id",
    "depot_id",
    "start_time",
    "end_time",
  ];
  for (const f of required) {
    if (!payload[f]) errors.push(`${f} là bắt buộc.`);
  }
  if (errors.length > 0) return { valid: false, errors };

  // ── Shift template ──
  const shift = await ShiftTemplate.findByPk(payload.shift_template_id);
  if (!shift) {
    errors.push("Không tìm thấy ca làm việc.");
    return { valid: false, errors };
  }
  const shiftPlain = toPlain(shift);

  // ── start < end ──
  const startSec = timeToSec(payload.start_time);
  const endSec = timeToSec(payload.end_time);
  if (startSec >= endSec) {
    errors.push("start_time phải nhỏ hơn end_time.");
  }

  // ── Nằm trong drive window ──
  const driveStartSec = timeToSec(shiftPlain.drive_start);
  const driveEndSec = timeToSec(shiftPlain.drive_end);
  if (startSec < driveStartSec) {
    errors.push(
      `start_time phải >= ${String(shiftPlain.drive_start).slice(0, 5)} (drive_start của ca).`,
    );
  }
  if (endSec > driveEndSec) {
    errors.push(
      `end_time phải <= ${String(shiftPlain.drive_end).slice(0, 5)} (drive_end của ca).`,
    );
  }

  if (errors.length > 0) return { valid: false, errors };

  // ── Vehicle: tồn tại + đúng depot + active ──
  const vehicle = await Vehicle.findByPk(payload.vehicle_id);
  if (!vehicle) {
    errors.push("Không tìm thấy xe.");
  } else {
    const v = toPlain(vehicle);
    if (!v.is_active) {
      errors.push(`Xe ${v.vehicle_code} đang ngưng hoạt động.`);
    }
    if (v.depot_id !== parseInt(payload.depot_id)) {
      errors.push(
        `Xe ${v.vehicle_code} thuộc depot #${v.depot_id}, không khớp depot #${payload.depot_id} của tuyến.`,
      );
    }
  }

  // ── Driver: tồn tại + type + active ──
  const driver = await Employee.findByPk(payload.employee_id);
  if (!driver) {
    errors.push("Không tìm thấy tài xế.");
  } else {
    const d = toPlain(driver);
    if (d.type !== "driver") {
      errors.push(`Nhân viên ${d.employee_code} không phải tài xế.`);
    }
    if (!d.is_active) {
      errors.push(`Tài xế ${d.employee_code} đang ngưng hoạt động.`);
    }
  }

  // ── Co-driver (nếu có): tồn tại + type co_driver ──
  if (payload.co_driver_id) {
    const coDriver = await Employee.findByPk(payload.co_driver_id);
    if (!coDriver) {
      errors.push("Không tìm thấy lơ xe.");
    } else {
      const cd = toPlain(coDriver);
      if (cd.type !== "co_driver") {
        errors.push(`Nhân viên ${cd.employee_code} không phải lơ xe.`);
      }
      if (!cd.is_active) {
        errors.push(`Lơ xe ${cd.employee_code} đang ngưng hoạt động.`);
      }
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  // ── Roster: driver phải có Roster cùng ngày + shift khớp ──
  const roster = await Roster.findOne({
    where: {
      employee_id: payload.employee_id,
      date: payload.date,
      shift_template_id: payload.shift_template_id,
    },
  });
  if (!roster) {
    errors.push(
      `Tài xế chưa có Roster ca này ngày ${payload.date}. Tạo Roster trước khi phân công.`,
    );
  } else {
    const r = toPlain(roster);
    if (r.status === "off" || r.status === "absent") {
      errors.push(
        `Roster của tài xế ngày ${payload.date} đang ở trạng thái "${r.status}". Không thể phân công.`,
      );
    }
  }

  // ── Unavailability ──
  const unavail = await DriverUnavailability.findOne({
    where: {
      driver_id: payload.employee_id,
      date_from: { [Op.lte]: payload.date },
      date_to: { [Op.gte]: payload.date },
    },
  });
  if (unavail) {
    const u = toPlain(unavail);
    errors.push(
      `Tài xế đang nghỉ (${u.type}): ${u.reason || "không có lý do"}.`,
    );
  }

  // ── Overlap check: driver / vehicle / co-driver ──
  const overlapWhere = {
    date: payload.date,
    status: { [Op.notIn]: ["cancelled"] },
    [Op.or]: [
      { employee_id: payload.employee_id },
      { vehicle_id: payload.vehicle_id },
    ],
  };
  if (payload.co_driver_id) {
    overlapWhere[Op.or].push({ co_driver_id: payload.co_driver_id });
  }
  if (excludeId) overlapWhere.id = { [Op.ne]: excludeId };

  const existing = await DutyAssignment.findAll({
    where: overlapWhere,
    include: [
      { model: Employee, as: "driver", attributes: ["employee_code"] },
      { model: Vehicle, as: "vehicle", attributes: ["vehicle_code"] },
    ],
  });

  for (const e of existing) {
    const exStart = timeToSec(e.start_time);
    const exEnd = timeToSec(e.end_time);
    // Overlap: start < exEnd && exStart < end
    if (startSec < exEnd && exStart < endSec) {
      const exPlain = toPlain(e);
      if (exPlain.employee_id === parseInt(payload.employee_id)) {
        errors.push(
          `Tài xế đã có phân công ${String(exPlain.start_time).slice(0, 5)}-${String(exPlain.end_time).slice(0, 5)} ngày ${payload.date}.`,
        );
      }
      if (exPlain.vehicle_id === parseInt(payload.vehicle_id)) {
        errors.push(
          `Xe ${exPlain.vehicle?.vehicle_code} đã có phân công ${String(exPlain.start_time).slice(0, 5)}-${String(exPlain.end_time).slice(0, 5)} ngày ${payload.date}.`,
        );
      }
      if (
        payload.co_driver_id &&
        exPlain.co_driver_id === parseInt(payload.co_driver_id)
      ) {
        errors.push(
          `Lơ xe đã có phân công ${String(exPlain.start_time).slice(0, 5)}-${String(exPlain.end_time).slice(0, 5)} ngày ${payload.date}.`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════
export async function getAll({
  date,
  from,
  to,
  route_id,
  employee_id,
  vehicle_id,
  shift_template_id,
  depot_id,
  status,
  page = 1,
  limit = 50,
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 50), 200);
  const offset = (page - 1) * limit;

  const where = {};
  if (date) where.date = date;
  else if (from && to) where.date = { [Op.between]: [from, to] };
  else if (from) where.date = { [Op.gte]: from };
  else if (to) where.date = { [Op.lte]: to };

  if (route_id) where.route_id = parseInt(route_id);
  if (employee_id) where.employee_id = parseInt(employee_id);
  if (vehicle_id) where.vehicle_id = parseInt(vehicle_id);
  if (shift_template_id) where.shift_template_id = parseInt(shift_template_id);
  if (depot_id) where.depot_id = parseInt(depot_id);
  if (status) where.status = status;

  const { count, rows } = await DutyAssignment.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["date", "ASC"],
      ["start_time", "ASC"],
    ],
    include: ASSIGNMENT_INCLUDE,
    distinct: true,
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(formatAssignment),
  };
}

// ═══════════════════════════════════════════════════════════════
// GET BY ID
// ═══════════════════════════════════════════════════════════════
export async function getById(id) {
  const a = await DutyAssignment.findByPk(id, { include: ASSIGNMENT_INCLUDE });
  if (!a) {
    const err = new Error("Không tìm thấy phân công.");
    err.status = 404;
    throw err;
  }
  return formatAssignment(a);
}

// ═══════════════════════════════════════════════════════════════
// GET BY DATE — overview 1 ngày
// ═══════════════════════════════════════════════════════════════
export async function getByDate(date, { depot_id } = {}) {
  if (!date) {
    const err = new Error("date là bắt buộc.");
    err.status = 400;
    throw err;
  }

  const where = { date };
  if (depot_id) where.depot_id = parseInt(depot_id);

  const rows = await DutyAssignment.findAll({
    where,
    order: [["start_time", "ASC"]],
    include: ASSIGNMENT_INCLUDE,
  });

  // Group theo shift
  const byShift = {};
  for (const r of rows) {
    const o = toPlain(r);
    const shiftCode = o.shift?.code || "UNKNOWN";
    if (!byShift[shiftCode]) {
      byShift[shiftCode] = {
        shift_code: shiftCode,
        shift_name: o.shift?.name || null,
        assignments: [],
      };
    }
    byShift[shiftCode].assignments.push(formatAssignment(r));
  }

  return {
    date,
    total: rows.length,
    by_shift: byShift,
  };
}

// ═══════════════════════════════════════════════════════════════
// CREATE — 1 assignment
// ═══════════════════════════════════════════════════════════════
export async function create(payload = {}, { force = false } = {}) {
  if (!force) {
    const validation = await validateAssignment(payload);
    if (!validation.valid) {
      const err = new Error(validation.errors.join(" "));
      err.status = 400;
      err.validation = validation;
      throw err;
    }
  }

  const now = new Date();
  const created = await DutyAssignment.create({
    date: payload.date,
    shift_template_id: parseInt(payload.shift_template_id),
    employee_id: parseInt(payload.employee_id),
    co_driver_id: payload.co_driver_id ? parseInt(payload.co_driver_id) : null,
    vehicle_id: parseInt(payload.vehicle_id),
    route_id: parseInt(payload.route_id),
    depot_id: parseInt(payload.depot_id),
    start_time: payload.start_time,
    end_time: payload.end_time,
    buffer_minutes: parseInt(payload.buffer_minutes) || DEFAULT_BUFFER_MINUTES,
    status: payload.status || "scheduled",
    notes: payload.notes || null,
    created_at: now,
    updated_at: now,
  });

  return getById(created.id);
}

// ═══════════════════════════════════════════════════════════════
// BULK CREATE — từ suggested_blocks
// ═══════════════════════════════════════════════════════════════
export async function bulkCreate(payload = {}) {
  const { date, route_id, shift_template_id, depot_id, blocks } = payload;

  if (!date || !route_id || !shift_template_id || !depot_id) {
    const err = new Error(
      "date, route_id, shift_template_id, depot_id là bắt buộc.",
    );
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(blocks) || blocks.length === 0) {
    const err = new Error("blocks là bắt buộc và phải là mảng không rỗng.");
    err.status = 400;
    throw err;
  }

  // ── Validate từng block trước khi save ──
  const prepared = [];
  const allErrors = [];

  // Check trùng trong chính payload (VD cùng xe được gán 2 blocks)
  const seenVehicle = new Set();
  const seenDriver = new Set();
  const seenCoDriver = new Set();

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const idx = i + 1;

    // Required
    if (!b.vehicle_id || !b.employee_id || !b.start_time || !b.end_time) {
      allErrors.push(
        `Block ${idx}: thiếu vehicle_id hoặc employee_id hoặc start_time hoặc end_time.`,
      );
      continue;
    }

    // Trùng trong payload
    if (seenVehicle.has(b.vehicle_id)) {
      allErrors.push(`Block ${idx}: xe đã dùng trong block khác.`);
    }
    if (seenDriver.has(b.employee_id)) {
      allErrors.push(`Block ${idx}: tài xế đã dùng trong block khác.`);
    }
    if (b.co_driver_id && seenCoDriver.has(b.co_driver_id)) {
      allErrors.push(`Block ${idx}: lơ xe đã dùng trong block khác.`);
    }

    seenVehicle.add(b.vehicle_id);
    seenDriver.add(b.employee_id);
    if (b.co_driver_id) seenCoDriver.add(b.co_driver_id);

    const assignmentPayload = {
      date,
      route_id,
      shift_template_id,
      depot_id,
      employee_id: b.employee_id,
      co_driver_id: b.co_driver_id,
      vehicle_id: b.vehicle_id,
      start_time: b.start_time,
      end_time: b.end_time,
      buffer_minutes: b.buffer_minutes,
      notes: b.notes,
    };

    const validation = await validateAssignment(assignmentPayload);
    if (!validation.valid) {
      allErrors.push(`Block ${idx}: ${validation.errors.join(" ")}`);
    } else {
      prepared.push({ idx, payload: assignmentPayload });
    }
  }

  if (allErrors.length > 0) {
    const err = new Error(
      "Có lỗi trong dữ liệu phân công:\n" + allErrors.join("\n"),
    );
    err.status = 400;
    err.errors = allErrors;
    throw err;
  }

  // ── Save trong transaction ──
  const transaction = await sequelize.transaction();
  try {
    const now = new Date();
    const rows = prepared.map((p) => ({
      ...p.payload,
      status: "scheduled",
      buffer_minutes:
        parseInt(p.payload.buffer_minutes) || DEFAULT_BUFFER_MINUTES,
      created_at: now,
      updated_at: now,
    }));

    const created = await DutyAssignment.bulkCreate(rows, { transaction });
    await transaction.commit();

    // Re-fetch với include
    const ids = created.map((c) => c.id);
    const full = await DutyAssignment.findAll({
      where: { id: { [Op.in]: ids } },
      include: ASSIGNMENT_INCLUDE,
      order: [["start_time", "ASC"]],
    });

    return {
      inserted: created.length,
      date,
      route_id,
      shift_template_id,
      depot_id,
      assignments: full.map(formatAssignment),
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════
export async function update(id, payload = {}, { force = false } = {}) {
  const existing = await DutyAssignment.findByPk(id);
  if (!existing) {
    const err = new Error("Không tìm thấy phân công.");
    err.status = 404;
    throw err;
  }

  const existingPlain = toPlain(existing);

  // Merge
  const merged = {
    date: payload.date ?? existingPlain.date,
    shift_template_id:
      payload.shift_template_id ?? existingPlain.shift_template_id,
    employee_id: payload.employee_id ?? existingPlain.employee_id,
    co_driver_id:
      payload.co_driver_id !== undefined
        ? payload.co_driver_id
        : existingPlain.co_driver_id,
    vehicle_id: payload.vehicle_id ?? existingPlain.vehicle_id,
    route_id: payload.route_id ?? existingPlain.route_id,
    depot_id: payload.depot_id ?? existingPlain.depot_id,
    start_time: payload.start_time ?? existingPlain.start_time,
    end_time: payload.end_time ?? existingPlain.end_time,
    buffer_minutes: payload.buffer_minutes ?? existingPlain.buffer_minutes,
  };

  if (!force) {
    const validation = await validateAssignment(merged, { excludeId: id });
    if (!validation.valid) {
      const err = new Error(validation.errors.join(" "));
      err.status = 400;
      err.validation = validation;
      throw err;
    }
  }

  const updates = { ...merged, updated_at: new Date() };
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.notes !== undefined) updates.notes = payload.notes || null;

  await existing.update(updates);
  return getById(id);
}

// ═══════════════════════════════════════════════════════════════
// CHANGE STATUS
// ═══════════════════════════════════════════════════════════════
export async function changeStatus(id, status) {
  const VALID = [
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
    "swapped",
  ];
  if (!VALID.includes(status)) {
    const err = new Error(`status phải là một trong: ${VALID.join(", ")}.`);
    err.status = 400;
    throw err;
  }

  const a = await DutyAssignment.findByPk(id);
  if (!a) {
    const err = new Error("Không tìm thấy phân công.");
    err.status = 404;
    throw err;
  }

  await a.update({ status, updated_at: new Date() });
  return getById(id);
}

// ═══════════════════════════════════════════════════════════════
// REMOVE — hard delete
// ═══════════════════════════════════════════════════════════════
export async function remove(id) {
  const a = await DutyAssignment.findByPk(id);
  if (!a) {
    const err = new Error("Không tìm thấy phân công.");
    err.status = 404;
    throw err;
  }
  await a.destroy();
  return { id: parseInt(id) };
}

// ═══════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════
export async function getStats({ date, from, to, depot_id } = {}) {
  const where = {};
  if (date) where.date = date;
  else if (from && to) where.date = { [Op.between]: [from, to] };
  else if (from) where.date = { [Op.gte]: from };
  else if (to) where.date = { [Op.lte]: to };
  if (depot_id) where.depot_id = parseInt(depot_id);

  const [total, byStatus, byShift, byDepot] = await Promise.all([
    DutyAssignment.count({ where }),
    DutyAssignment.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where,
      group: ["status"],
      raw: true,
    }),
    DutyAssignment.findAll({
      attributes: [
        "shift_template_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where,
      group: ["shift_template_id"],
      raw: true,
    }),
    DutyAssignment.findAll({
      attributes: [
        "depot_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where,
      group: ["depot_id"],
      raw: true,
    }),
  ]);

  return {
    date_range: { date: date || null, from: from || null, to: to || null },
    total,
    by_status: byStatus.reduce((acc, r) => {
      acc[r.status] = parseInt(r.count);
      return acc;
    }, {}),
    by_shift: byShift.reduce((acc, r) => {
      acc[r.shift_template_id] = parseInt(r.count);
      return acc;
    }, {}),
    by_depot: byDepot.reduce((acc, r) => {
      acc[r.depot_id] = parseInt(r.count);
      return acc;
    }, {}),
  };
}
