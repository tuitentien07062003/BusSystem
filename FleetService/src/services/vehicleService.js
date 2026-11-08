import { Op } from "sequelize";
import Vehicle from "../models/vehicleModel.js";
import VehicleType from "../models/vehicleTypeModel.js";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

// Format gọn — flatten type info ra ngoài
function formatVehicle(v) {
  if (!v) return null;
  const o = toPlain(v);
  return {
    id: o.id,
    vehicle_code: o.vehicle_code,
    license_plate: o.license_plate,
    vehicle_type_id: o.vehicle_type_id,
    type_code: o.type?.type_code || null,
    type_name: o.type?.name || null,
    capacity_seated: o.capacity_seated ?? o.type?.capacity_seated ?? null,
    capacity_standing: o.capacity_standing ?? o.type?.capacity_standing ?? null,
    battery_capacity_kwh: o.battery_capacity_kwh
      ? parseFloat(o.battery_capacity_kwh)
      : null,
    range_km: o.range_km,
    depot_id: o.depot_id,
    is_active: o.is_active,
    created_at: o.created_at,
    updated_at: o.updated_at,
  };
}

function validatePayload(payload, { requireAll = false } = {}) {
  const errors = [];

  if (requireAll || payload.vehicle_code !== undefined) {
    const v = String(payload.vehicle_code ?? "").trim();
    if (!v) errors.push("vehicle_code không được để trống.");
    else if (v.length > 50)
      errors.push("vehicle_code quá dài (tối đa 50 ký tự).");
  }

  if (requireAll || payload.license_plate !== undefined) {
    const v = String(payload.license_plate ?? "").trim();
    if (!v) errors.push("license_plate không được để trống.");
    else if (v.length > 20)
      errors.push("license_plate quá dài (tối đa 20 ký tự).");
    // Format VN: 51B-12345 / 51A 12345 / 51B12345
    else if (!/^[0-9]{2}[A-Z][- ]?[0-9]{4,5}$/i.test(v)) {
      errors.push("license_plate không đúng định dạng VN (VD: 51B-12345).");
    }
  }

  if (
    payload.battery_capacity_kwh !== undefined &&
    payload.battery_capacity_kwh !== null
  ) {
    const v = parseFloat(payload.battery_capacity_kwh);
    if (isNaN(v) || v < 0 || v > 2000) {
      errors.push("battery_capacity_kwh phải trong khoảng 0 - 2000.");
    }
  }

  if (payload.range_km !== undefined && payload.range_km !== null) {
    const v = parseInt(payload.range_km);
    if (isNaN(v) || v < 0 || v > 2000) {
      errors.push("range_km phải trong khoảng 0 - 2000.");
    }
  }

  if (
    payload.capacity_seated !== undefined &&
    payload.capacity_seated !== null
  ) {
    const v = parseInt(payload.capacity_seated);
    if (isNaN(v) || v < 0 || v > 200) {
      errors.push("capacity_seated phải trong khoảng 0 - 200.");
    }
  }

  return errors;
}

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════
export async function getAllVehicles({
  page = 1,
  limit = 20,
  depot_id,
  vehicle_type_id,
  is_active,
  keyword = "",
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;

  const where = {};
  if (depot_id !== undefined && depot_id !== null && depot_id !== "") {
    where.depot_id = parseInt(depot_id);
  }
  if (
    vehicle_type_id !== undefined &&
    vehicle_type_id !== null &&
    vehicle_type_id !== ""
  ) {
    where.vehicle_type_id = parseInt(vehicle_type_id);
  }
  if (typeof is_active === "boolean") where.is_active = is_active;

  const kw = String(keyword || "").trim();
  if (kw) {
    const like = `%${kw}%`;
    where[Op.or] = [
      { vehicle_code: { [Op.iLike]: like } },
      { license_plate: { [Op.iLike]: like } },
    ];
  }

  const { count, rows } = await Vehicle.findAndCountAll({
    where,
    limit,
    offset,
    order: [["id", "ASC"]],
    include: [
      {
        model: VehicleType,
        as: "type",
        required: false,
      },
    ],
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(formatVehicle),
  };
}

// ═══════════════════════════════════════════════════════════════
// GET BY ID
// ═══════════════════════════════════════════════════════════════
export async function getVehicleById(id) {
  const v = await Vehicle.findByPk(id, {
    include: [{ model: VehicleType, as: "type", required: false }],
  });
  if (!v) {
    const err = new Error("Không tìm thấy xe.");
    err.status = 404;
    throw err;
  }
  return formatVehicle(v);
}

// ═══════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════
export async function createVehicle(payload = {}) {
  const errors = validatePayload(payload, { requireAll: true });
  if (errors.length > 0) {
    const err = new Error(errors.join(" "));
    err.status = 400;
    throw err;
  }

  const vehicle_code = String(payload.vehicle_code).trim();
  const license_plate = String(payload.license_plate).trim();

  // Check unique
  const dupCode = await Vehicle.findOne({ where: { vehicle_code } });
  if (dupCode) {
    const err = new Error(`vehicle_code "${vehicle_code}" đã tồn tại.`);
    err.status = 409;
    throw err;
  }
  const dupPlate = await Vehicle.findOne({ where: { license_plate } });
  if (dupPlate) {
    const err = new Error(`license_plate "${license_plate}" đã tồn tại.`);
    err.status = 409;
    throw err;
  }

  // Validate vehicle_type_id tồn tại (nếu có truyền)
  if (payload.vehicle_type_id) {
    const t = await VehicleType.findByPk(payload.vehicle_type_id);
    if (!t) {
      const err = new Error("vehicle_type_id không tồn tại.");
      err.status = 400;
      throw err;
    }
  }

  const now = new Date();
  const created = await Vehicle.create({
    vehicle_code,
    license_plate,
    vehicle_type_id: payload.vehicle_type_id ?? null,
    capacity_seated: payload.capacity_seated ?? null,
    capacity_standing: payload.capacity_standing ?? null,
    battery_capacity_kwh: payload.battery_capacity_kwh ?? null,
    range_km: payload.range_km ?? null,
    depot_id: payload.depot_id ?? null,
    is_active: payload.is_active !== undefined ? !!payload.is_active : true,
    created_at: now,
    updated_at: now,
  });

  return getVehicleById(created.id);
}

// ═══════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════
export async function updateVehicle(id, payload = {}) {
  const v = await Vehicle.findByPk(id);
  if (!v) {
    const err = new Error("Không tìm thấy xe.");
    err.status = 404;
    throw err;
  }

  const errors = validatePayload(payload, { requireAll: false });
  if (errors.length > 0) {
    const err = new Error(errors.join(" "));
    err.status = 400;
    throw err;
  }

  const updates = {};

  if (payload.vehicle_code !== undefined) {
    const val = String(payload.vehicle_code).trim();
    if (val !== v.vehicle_code) {
      const dup = await Vehicle.findOne({ where: { vehicle_code: val } });
      if (dup) {
        const err = new Error(`vehicle_code "${val}" đã tồn tại.`);
        err.status = 409;
        throw err;
      }
    }
    updates.vehicle_code = val;
  }

  if (payload.license_plate !== undefined) {
    const val = String(payload.license_plate).trim();
    if (val !== v.license_plate) {
      const dup = await Vehicle.findOne({ where: { license_plate: val } });
      if (dup) {
        const err = new Error(`license_plate "${val}" đã tồn tại.`);
        err.status = 409;
        throw err;
      }
    }
    updates.license_plate = val;
  }

  if (payload.vehicle_type_id !== undefined) {
    if (payload.vehicle_type_id !== null) {
      const t = await VehicleType.findByPk(payload.vehicle_type_id);
      if (!t) {
        const err = new Error("vehicle_type_id không tồn tại.");
        err.status = 400;
        throw err;
      }
    }
    updates.vehicle_type_id = payload.vehicle_type_id;
  }

  if (payload.capacity_seated !== undefined) {
    updates.capacity_seated = payload.capacity_seated;
  }
  if (payload.capacity_standing !== undefined) {
    updates.capacity_standing = payload.capacity_standing;
  }
  if (payload.battery_capacity_kwh !== undefined) {
    updates.battery_capacity_kwh = payload.battery_capacity_kwh;
  }
  if (payload.range_km !== undefined) {
    updates.range_km = payload.range_km;
  }
  if (payload.depot_id !== undefined) {
    updates.depot_id = payload.depot_id;
  }
  if (payload.is_active !== undefined) {
    updates.is_active = !!payload.is_active;
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error("Không có trường nào để cập nhật.");
    err.status = 400;
    throw err;
  }

  updates.updated_at = new Date();
  await v.update(updates);

  return getVehicleById(id);
}

// ═══════════════════════════════════════════════════════════════
// CHANGE STATUS
// ═══════════════════════════════════════════════════════════════
export async function changeVehicleStatus(id, is_active) {
  if (typeof is_active !== "boolean") {
    const err = new Error("is_active phải là kiểu boolean.");
    err.status = 400;
    throw err;
  }

  const v = await Vehicle.findByPk(id);
  if (!v) {
    const err = new Error("Không tìm thấy xe.");
    err.status = 404;
    throw err;
  }

  await v.update({ is_active, updated_at: new Date() });
  return getVehicleById(id);
}

// ═══════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════
export async function getVehicleStats() {
  const [total, active, inactive] = await Promise.all([
    Vehicle.count(),
    Vehicle.count({ where: { is_active: true } }),
    Vehicle.count({ where: { is_active: false } }),
  ]);

  // Đếm theo depot
  const byDepot = await Vehicle.findAll({
    attributes: [
      "depot_id",
      [Vehicle.sequelize.fn("COUNT", Vehicle.sequelize.col("id")), "count"],
    ],
    group: ["depot_id"],
    raw: true,
  });

  // Đếm theo type
  const byType = await Vehicle.findAll({
    attributes: [
      "vehicle_type_id",
      [Vehicle.sequelize.fn("COUNT", Vehicle.sequelize.col("id")), "count"],
    ],
    group: ["vehicle_type_id"],
    raw: true,
  });

  return {
    total,
    active,
    inactive,
    by_depot: byDepot.map((r) => ({
      depot_id: r.depot_id,
      count: parseInt(r.count),
    })),
    by_type: byType.map((r) => ({
      vehicle_type_id: r.vehicle_type_id,
      count: parseInt(r.count),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// VEHICLE TYPES — CRUD nhẹ (chỉ list + get, không cần full CRUD)
// ═══════════════════════════════════════════════════════════════
export async function getAllVehicleTypes() {
  const rows = await VehicleType.findAll({ order: [["id", "ASC"]] });
  return rows.map(toPlain);
}

export async function getVehicleTypeById(id) {
  const t = await VehicleType.findByPk(id);
  if (!t) {
    const err = new Error("Không tìm thấy loại xe.");
    err.status = 404;
    throw err;
  }
  return toPlain(t);
}
