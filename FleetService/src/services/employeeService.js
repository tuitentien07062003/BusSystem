import { Op } from "sequelize";
import Employee from "../models/employeeModel.js";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

const VALID_TYPES = ["driver", "co_driver", "depot_staff", "dispatcher"];

function validatePayload(payload, { requireAll = false } = {}) {
  const errors = [];

  // employee_code
  if (requireAll || payload.employee_code !== undefined) {
    const v = String(payload.employee_code ?? "").trim();
    if (!v) errors.push("employee_code không được để trống.");
    else if (v.length > 50)
      errors.push("employee_code quá dài (tối đa 50 ký tự).");
  }

  // full_name
  if (requireAll || payload.full_name !== undefined) {
    const v = String(payload.full_name ?? "").trim();
    if (!v) errors.push("full_name không được để trống.");
    else if (v.length > 150)
      errors.push("full_name quá dài (tối đa 150 ký tự).");
  }

  // type
  if (requireAll || payload.type !== undefined) {
    if (!VALID_TYPES.includes(payload.type)) {
      errors.push(`type phải là một trong: ${VALID_TYPES.join(", ")}.`);
    }
  }

  // email format
  if (payload.email) {
    const v = String(payload.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      errors.push("email không đúng định dạng.");
    }
  }

  // phone format (VN)
  if (payload.phone) {
    const v = String(payload.phone).trim();
    if (!/^(0|\+84)\d{9,10}$/.test(v.replace(/\s+/g, ""))) {
      errors.push("phone không đúng định dạng VN (VD: 0912345678).");
    }
  }

  // license_expiry không được ở quá khứ (cảnh báo, không block)
  // → bỏ qua, để business check ở API riêng

  return errors;
}

// ═══════════════════════════════════════════════════════════════
// LIST — phân trang + filter
// ═══════════════════════════════════════════════════════════════
export async function getAllEmployees({
  page = 1,
  limit = 20,
  type,
  is_active,
  keyword = "",
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;

  const where = {};
  if (type) where.type = type;
  if (typeof is_active === "boolean") where.is_active = is_active;

  const kw = String(keyword || "").trim();
  if (kw) {
    const like = `%${kw}%`;
    where[Op.or] = [
      { employee_code: { [Op.iLike]: like } },
      { full_name: { [Op.iLike]: like } },
      { phone: { [Op.iLike]: like } },
      { email: { [Op.iLike]: like } },
    ];
  }

  const { count, rows } = await Employee.findAndCountAll({
    where,
    limit,
    offset,
    order: [["id", "ASC"]],
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(toPlain),
  };
}

// ═══════════════════════════════════════════════════════════════
// GET BY ID
// ═══════════════════════════════════════════════════════════════
export async function getEmployeeById(id) {
  const emp = await Employee.findByPk(id);
  if (!emp) {
    const err = new Error("Không tìm thấy nhân viên.");
    err.status = 404;
    throw err;
  }
  return toPlain(emp);
}

// ═══════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════
export async function createEmployee(payload = {}) {
  const errors = validatePayload(payload, { requireAll: true });
  if (errors.length > 0) {
    const err = new Error(errors.join(" "));
    err.status = 400;
    throw err;
  }

  const employee_code = String(payload.employee_code).trim();
  const dup = await Employee.findOne({ where: { employee_code } });
  if (dup) {
    const err = new Error(`employee_code "${employee_code}" đã tồn tại.`);
    err.status = 409;
    throw err;
  }

  const now = new Date();
  const created = await Employee.create({
    employee_code,
    full_name: String(payload.full_name).trim(),
    phone: payload.phone ? String(payload.phone).trim() : null,
    email: payload.email ? String(payload.email).trim() : null,
    type: payload.type,
    license_number: payload.license_number || null,
    license_class: payload.license_class || null,
    license_expiry: payload.license_expiry || null,
    hire_date: payload.hire_date || null,
    is_active: payload.is_active !== undefined ? !!payload.is_active : true,
    user_id: payload.user_id ?? null,
    created_at: now,
    updated_at: now,
  });

  return toPlain(created);
}

// ═══════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════
export async function updateEmployee(id, payload = {}) {
  const emp = await Employee.findByPk(id);
  if (!emp) {
    const err = new Error("Không tìm thấy nhân viên.");
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

  if (payload.employee_code !== undefined) {
    const v = String(payload.employee_code).trim();
    if (v !== emp.employee_code) {
      const dup = await Employee.findOne({ where: { employee_code: v } });
      if (dup) {
        const err = new Error(`employee_code "${v}" đã tồn tại.`);
        err.status = 409;
        throw err;
      }
    }
    updates.employee_code = v;
  }

  if (payload.full_name !== undefined) {
    updates.full_name = String(payload.full_name).trim();
  }
  if (payload.phone !== undefined) {
    updates.phone = payload.phone ? String(payload.phone).trim() : null;
  }
  if (payload.email !== undefined) {
    updates.email = payload.email ? String(payload.email).trim() : null;
  }
  if (payload.type !== undefined) updates.type = payload.type;
  if (payload.license_number !== undefined) {
    updates.license_number = payload.license_number || null;
  }
  if (payload.license_class !== undefined) {
    updates.license_class = payload.license_class || null;
  }
  if (payload.license_expiry !== undefined) {
    updates.license_expiry = payload.license_expiry || null;
  }
  if (payload.hire_date !== undefined) {
    updates.hire_date = payload.hire_date || null;
  }
  if (payload.is_active !== undefined) {
    updates.is_active = !!payload.is_active;
  }
  if (payload.user_id !== undefined) {
    updates.user_id = payload.user_id ?? null;
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error("Không có trường nào để cập nhật.");
    err.status = 400;
    throw err;
  }

  updates.updated_at = new Date();
  await emp.update(updates);

  return getEmployeeById(id);
}

// ═══════════════════════════════════════════════════════════════
// CHANGE STATUS
// ═══════════════════════════════════════════════════════════════
export async function changeEmployeeStatus(id, is_active) {
  if (typeof is_active !== "boolean") {
    const err = new Error("is_active phải là kiểu boolean.");
    err.status = 400;
    throw err;
  }

  const emp = await Employee.findByPk(id);
  if (!emp) {
    const err = new Error("Không tìm thấy nhân viên.");
    err.status = 404;
    throw err;
  }

  await emp.update({ is_active, updated_at: new Date() });
  return getEmployeeById(id);
}

// ═══════════════════════════════════════════════════════════════
// STATS — đếm nhanh theo type
// ═══════════════════════════════════════════════════════════════
export async function getEmployeeStats() {
  const [total, drivers, coDrivers, depotStaff, dispatchers, active, inactive] =
    await Promise.all([
      Employee.count(),
      Employee.count({ where: { type: "driver" } }),
      Employee.count({ where: { type: "co_driver" } }),
      Employee.count({ where: { type: "depot_staff" } }),
      Employee.count({ where: { type: "dispatcher" } }),
      Employee.count({ where: { is_active: true } }),
      Employee.count({ where: { is_active: false } }),
    ]);

  return {
    total,
    by_type: {
      driver: drivers,
      co_driver: coDrivers,
      depot_staff: depotStaff,
      dispatcher: dispatchers,
    },
    active,
    inactive,
  };
}
