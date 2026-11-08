import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Incident from "../models/incidentModel.js";
import IncidentAction from "../models/incidentActionModel.js";
import Employee from "../models/employeeModel.js";
import Vehicle from "../models/vehicleModel.js";

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════
const VALID_TYPES = [
  "accident",
  "traffic_jam",
  "breakdown",
  "passenger_emergency",
  "other",
];

const VALID_SEVERITIES = ["low", "medium", "high", "critical"];

const VALID_ACTIONS = ["reroute", "cancel_trip", "substitute_vehicle", "none"];

const VALID_STATUSES = ["reported", "acknowledged", "resolved", "closed"];

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

function formatIncident(r) {
  if (!r) return null;
  const o = toPlain(r);
  return {
    id: o.id,
    incident_code: o.incident_code,
    trip_id: o.trip_id,
    route_id: o.route_id,
    vehicle_id: o.vehicle_id,
    vehicle: o.vehicle
      ? {
          id: o.vehicle.id,
          vehicle_code: o.vehicle.vehicle_code,
          license_plate: o.vehicle.license_plate,
        }
      : null,
    driver_id: o.driver_id,
    driver: o.driver
      ? {
          id: o.driver.id,
          employee_code: o.driver.employee_code,
          full_name: o.driver.full_name,
        }
      : null,
    type: o.type,
    severity: o.severity,
    description: o.description,
    latitude: o.latitude ? parseFloat(o.latitude) : null,
    longitude: o.longitude ? parseFloat(o.longitude) : null,
    status: o.status,
    admin_action: o.admin_action,
    admin_action_notes: o.admin_action_notes,
    affects_otp: o.affects_otp,
    reported_by: o.reported_by,
    acknowledged_by: o.acknowledged_by,
    acknowledged_at: o.acknowledged_at,
    resolved_at: o.resolved_at,
    created_at: o.created_at,
    actions: (o.actions || []).map((a) => ({
      id: a.id,
      action_type: a.action_type,
      performed_by: a.performed_by,
      notes: a.notes,
      created_at: a.created_at,
    })),
  };
}

const INCIDENT_INCLUDE = [
  {
    model: Employee,
    as: "driver",
    attributes: ["id", "employee_code", "full_name"],
    required: false,
  },
  {
    model: Vehicle,
    as: "vehicle",
    attributes: ["id", "vehicle_code", "license_plate"],
    required: false,
  },
];

const FULL_INCLUDE = [
  ...INCIDENT_INCLUDE,
  {
    model: IncidentAction,
    as: "actions",
    required: false,
  },
];

// ═══════════════════════════════════════════════════════════════
// Sinh mã sự cố: INC-YYYYMMDD-XXX
// ═══════════════════════════════════════════════════════════════
async function generateIncidentCode(date = new Date()) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const count = await Incident.count({
    where: {
      created_at: { [Op.between]: [dayStart, dayEnd] },
    },
  });

  const p = (n) => String(n).padStart(2, "0");
  const dateStr = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`;
  return `INC-${dateStr}-${String(count + 1).padStart(3, "0")}`;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATE — payload khi tạo / sửa sự cố
// ═══════════════════════════════════════════════════════════════
function validateIncidentPayload(payload, { requireAll = true } = {}) {
  const errors = [];

  if (requireAll || payload.type !== undefined) {
    if (!payload.type) errors.push("type là bắt buộc.");
    else if (!VALID_TYPES.includes(payload.type)) {
      errors.push(`type phải là một trong: ${VALID_TYPES.join(", ")}.`);
    }
  }

  if (payload.severity !== undefined && payload.severity !== null) {
    if (!VALID_SEVERITIES.includes(payload.severity)) {
      errors.push(
        `severity phải là một trong: ${VALID_SEVERITIES.join(", ")}.`,
      );
    }
  }

  if (
    payload.latitude !== undefined &&
    payload.latitude !== null &&
    payload.latitude !== ""
  ) {
    const v = parseFloat(payload.latitude);
    if (isNaN(v) || v < -90 || v > 90) {
      errors.push("latitude phải trong khoảng -90 đến 90.");
    }
  }

  if (
    payload.longitude !== undefined &&
    payload.longitude !== null &&
    payload.longitude !== ""
  ) {
    const v = parseFloat(payload.longitude);
    if (isNaN(v) || v < -180 || v > 180) {
      errors.push("longitude phải trong khoảng -180 đến 180.");
    }
  }

  if (
    payload.description !== undefined &&
    payload.description !== null &&
    String(payload.description).length > 2000
  ) {
    errors.push("description quá dài (tối đa 2000 ký tự).");
  }

  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════
export async function getAll({
  status,
  type,
  severity,
  route_id,
  vehicle_id,
  driver_id,
  trip_id,
  from,
  to,
  page = 1,
  limit = 50,
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 50), 200);
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (severity) where.severity = severity;
  if (route_id) where.route_id = parseInt(route_id);
  if (vehicle_id) where.vehicle_id = parseInt(vehicle_id);
  if (driver_id) where.driver_id = parseInt(driver_id);
  if (trip_id) where.trip_id = parseInt(trip_id);

  if (from && to) {
    where.created_at = { [Op.between]: [from, to] };
  } else if (from) {
    where.created_at = { [Op.gte]: from };
  } else if (to) {
    where.created_at = { [Op.lte]: to };
  }

  const { count, rows } = await Incident.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: INCIDENT_INCLUDE,
    distinct: true,
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(formatIncident),
  };
}

// ═══════════════════════════════════════════════════════════════
// GET ACTIVE — sự cố chưa resolve
// ═══════════════════════════════════════════════════════════════
export async function getActive({ route_id } = {}) {
  const where = {
    status: { [Op.in]: ["reported", "acknowledged"] },
  };
  if (route_id) where.route_id = parseInt(route_id);

  const rows = await Incident.findAll({
    where,
    order: [
      ["severity", "DESC"],
      ["created_at", "DESC"],
    ],
    include: INCIDENT_INCLUDE,
  });

  return { total: rows.length, data: rows.map(formatIncident) };
}

// ═══════════════════════════════════════════════════════════════
// GET BY DATE — sự cố 1 ngày
// ═══════════════════════════════════════════════════════════════
export async function getByDate(date, { depot_id } = {}) {
  if (!date) {
    const err = new Error("date là bắt buộc (YYYY-MM-DD).");
    err.status = 400;
    throw err;
  }

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const where = {
    created_at: { [Op.between]: [dayStart, dayEnd] },
  };

  const rows = await Incident.findAll({
    where,
    order: [["created_at", "DESC"]],
    include: INCIDENT_INCLUDE,
  });

  // Nhóm theo status
  const byStatus = rows.reduce((acc, r) => {
    const o = toPlain(r);
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return {
    date,
    total: rows.length,
    by_status: byStatus,
    data: rows.map(formatIncident),
  };
}

// ═══════════════════════════════════════════════════════════════
// GET BY ID
// ═══════════════════════════════════════════════════════════════
export async function getById(id) {
  const r = await Incident.findByPk(id, { include: FULL_INCLUDE });
  if (!r) {
    const err = new Error("Không tìm thấy sự cố.");
    err.status = 404;
    throw err;
  }
  return formatIncident(r);
}

// ═══════════════════════════════════════════════════════════════
// CREATE — driver báo sự cố
// ═══════════════════════════════════════════════════════════════
export async function create(payload = {}) {
  const validation = validateIncidentPayload(payload, { requireAll: true });
  if (!validation.valid) {
    const err = new Error(validation.errors.join(" "));
    err.status = 400;
    err.validation = validation;
    throw err;
  }

  // Kiểm tra xe + tài xế tồn tại (nếu có truyền)
  if (payload.vehicle_id) {
    const v = await Vehicle.findByPk(payload.vehicle_id);
    if (!v) {
      const err = new Error("Không tìm thấy xe.");
      err.status = 404;
      throw err;
    }
  }
  if (payload.driver_id) {
    const d = await Employee.findByPk(payload.driver_id);
    if (!d) {
      const err = new Error("Không tìm thấy tài xế.");
      err.status = 404;
      throw err;
    }
  }

  // Sinh mã sự cố
  const code = await generateIncidentCode();

  // traffic_jam không trừ OTP
  const affectsOtp = payload.type !== "traffic_jam";

  const created = await Incident.create({
    incident_code: code,
    trip_id: payload.trip_id ? parseInt(payload.trip_id) : null,
    route_id: payload.route_id ? parseInt(payload.route_id) : null,
    vehicle_id: payload.vehicle_id ? parseInt(payload.vehicle_id) : null,
    driver_id: payload.driver_id ? parseInt(payload.driver_id) : null,
    type: payload.type,
    severity: payload.severity || "medium",
    description: payload.description || null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    status: "reported",
    admin_action: "none",
    affects_otp: affectsOtp,
    reported_by: payload.reported_by ?? 1,
    created_at: new Date(),
  });

  return getById(created.id);
}

// ═══════════════════════════════════════════════════════════════
// ACKNOWLEDGE — admin tiếp nhận
// ═══════════════════════════════════════════════════════════════
export async function acknowledge(id, { acknowledged_by } = {}) {
  const r = await Incident.findByPk(id);
  if (!r) {
    const err = new Error("Không tìm thấy sự cố.");
    err.status = 404;
    throw err;
  }

  const o = toPlain(r);
  if (o.status !== "reported") {
    const err = new Error(
      `Chỉ có thể tiếp nhận sự cố đang ở trạng thái "reported". Hiện tại: "${o.status}".`,
    );
    err.status = 409;
    throw err;
  }

  await r.update({
    status: "acknowledged",
    acknowledged_by: acknowledged_by ?? 1,
    acknowledged_at: new Date(),
  });

  return getById(id);
}

// ═══════════════════════════════════════════════════════════════
// ADD ACTION — log hành động xử lý
// ═══════════════════════════════════════════════════════════════
export async function addAction(id, { action_type, performed_by, notes } = {}) {
  const VALID_ACTION_TYPES = [
    "call",
    "reroute",
    "substitute",
    "cancel",
    "note",
  ];

  if (!action_type || !VALID_ACTION_TYPES.includes(action_type)) {
    const err = new Error(
      `action_type phải là một trong: ${VALID_ACTION_TYPES.join(", ")}.`,
    );
    err.status = 400;
    throw err;
  }

  const r = await Incident.findByPk(id);
  if (!r) {
    const err = new Error("Không tìm thấy sự cố.");
    err.status = 404;
    throw err;
  }

  const action = await IncidentAction.create({
    incident_id: parseInt(id),
    action_type,
    performed_by: performed_by ?? 1,
    notes: notes || null,
    created_at: new Date(),
  });

  return {
    id: action.id,
    incident_id: parseInt(id),
    action_type: action.action_type,
    performed_by: action.performed_by,
    notes: action.notes,
    created_at: action.created_at,
  };
}

// ═══════════════════════════════════════════════════════════════
// RESOLVE — admin đóng sự cố
// ═══════════════════════════════════════════════════════════════
export async function resolve(id, { admin_action, admin_action_notes } = {}) {
  const r = await Incident.findByPk(id);
  if (!r) {
    const err = new Error("Không tìm thấy sự cố.");
    err.status = 404;
    throw err;
  }

  const o = toPlain(r);
  if (o.status === "resolved" || o.status === "closed") {
    const err = new Error("Sự cố đã được xử lý hoặc đã đóng.");
    err.status = 409;
    throw err;
  }

  if (!admin_action || !VALID_ACTIONS.includes(admin_action)) {
    const err = new Error(
      `admin_action phải là một trong: ${VALID_ACTIONS.join(", ")}.`,
    );
    err.status = 400;
    throw err;
  }

  if (
    admin_action !== "none" &&
    (!admin_action_notes || !String(admin_action_notes).trim())
  ) {
    const err = new Error("Cần ghi chú lý do xử lý sự cố.");
    err.status = 400;
    throw err;
  }

  await r.update({
    status: "resolved",
    admin_action,
    admin_action_notes: admin_action_notes || null,
    resolved_at: new Date(),
  });

  return getById(id);
}

// ═══════════════════════════════════════════════════════════════
// CLOSE — đóng hẳn sự cố (sau khi đã resolve)
// ═══════════════════════════════════════════════════════════════
export async function close(id) {
  const r = await Incident.findByPk(id);
  if (!r) {
    const err = new Error("Không tìm thấy sự cố.");
    err.status = 404;
    throw err;
  }

  const o = toPlain(r);
  if (o.status !== "resolved") {
    const err = new Error(
      `Chỉ có thể đóng sự cố đã resolve. Hiện tại: "${o.status}".`,
    );
    err.status = 409;
    throw err;
  }

  await r.update({ status: "closed" });
  return getById(id);
}

// ═══════════════════════════════════════════════════════════════
// UPDATE — sửa sự cố
// ═══════════════════════════════════════════════════════════════
export async function update(id, payload = {}) {
  const r = await Incident.findByPk(id);
  if (!r) {
    const err = new Error("Không tìm thấy sự cố.");
    err.status = 404;
    throw err;
  }

  const validation = validateIncidentPayload(payload, { requireAll: false });
  if (!validation.valid) {
    const err = new Error(validation.errors.join(" "));
    err.status = 400;
    err.validation = validation;
    throw err;
  }

  const updates = {};
  if (payload.type !== undefined) {
    updates.type = payload.type;
    updates.affects_otp = payload.type !== "traffic_jam";
  }
  if (payload.severity !== undefined) updates.severity = payload.severity;
  if (payload.description !== undefined) {
    updates.description = payload.description || null;
  }
  if (payload.latitude !== undefined) {
    updates.latitude = payload.latitude ?? null;
  }
  if (payload.longitude !== undefined) {
    updates.longitude = payload.longitude ?? null;
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error("Không có trường nào để cập nhật.");
    err.status = 400;
    throw err;
  }

  await r.update(updates);
  return getById(id);
}

// ═══════════════════════════════════════════════════════════════
// REMOVE
// ═══════════════════════════════════════════════════════════════
export async function remove(id) {
  const r = await Incident.findByPk(id);
  if (!r) {
    const err = new Error("Không tìm thấy sự cố.");
    err.status = 404;
    throw err;
  }
  await r.destroy();
  return { id: parseInt(id) };
}

// ═══════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════
export async function getStats({ from, to, route_id, depot_id } = {}) {
  const where = {};
  if (route_id) where.route_id = parseInt(route_id);
  if (from && to) {
    where.created_at = { [Op.between]: [from, to] };
  } else if (from) {
    where.created_at = { [Op.gte]: from };
  } else if (to) {
    where.created_at = { [Op.lte]: to };
  }

  const [total, byStatus, byType, bySeverity] = await Promise.all([
    Incident.count({ where }),
    Incident.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where,
      group: ["status"],
      raw: true,
    }),
    Incident.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where,
      group: ["type"],
      raw: true,
    }),
    Incident.findAll({
      attributes: [
        "severity",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where,
      group: ["severity"],
      raw: true,
    }),
  ]);

  return {
    date_range: { from: from || null, to: to || null },
    total,
    by_status: byStatus.reduce((acc, r) => {
      acc[r.status] = parseInt(r.count);
      return acc;
    }, {}),
    by_type: byType.reduce((acc, r) => {
      acc[r.type] = parseInt(r.count);
      return acc;
    }, {}),
    by_severity: bySeverity.reduce((acc, r) => {
      acc[r.severity] = parseInt(r.count);
      return acc;
    }, {}),
  };
}
