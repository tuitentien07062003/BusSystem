// src/services/agencyService.js
// Business logic cho Agency: list, search, CRUD, đổi trạng thái
import { Op } from "sequelize";
import Agency from "../models/agencyModel.js";

// ─────────────────────────────────────────────────────────
// Helper: chuẩn hoá instance Sequelize thành object gọn gàng
// ─────────────────────────────────────────────────────────
function toPlain(agency) {
  if (!agency) return null;
  const obj = agency.get ? agency.get({ plain: true }) : agency;
  return {
    id: obj.id,
    agency_id: obj.agency_id,
    agency_name: obj.agency_name,
    agency_url: obj.agency_url,
    agency_timezone: obj.agency_timezone,
    is_active: obj.is_active,
    created_at: obj.created_at,
    updated_at: obj.updated_at,
  };
}

// ─────────────────────────────────────────────────────────
// Chuẩn hoá & kiểm tra payload
// ─────────────────────────────────────────────────────────
function validatePayload(payload, { requireAll = false } = {}) {
  const errors = [];

  if (requireAll || payload.agency_id !== undefined) {
    const v = String(payload.agency_id ?? "").trim();
    if (!v) errors.push("agency_id không được để trống.");
    else if (v.length > 100) errors.push("agency_id quá dài (tối đa 100 ký tự).");
  }

  if (requireAll || payload.agency_name !== undefined) {
    const v = String(payload.agency_name ?? "").trim();
    if (!v) errors.push("agency_name không được để trống.");
    else if (v.length > 255) errors.push("agency_name quá dài (tối đa 255 ký tự).");
  }

  if (payload.agency_url !== undefined && payload.agency_url !== null) {
    const v = String(payload.agency_url).trim();
    if (v && !/^https?:\/\//i.test(v)) {
      errors.push("agency_url phải bắt đầu bằng http:// hoặc https://");
    }
  }

  if (payload.agency_timezone !== undefined && payload.agency_timezone !== null) {
    const v = String(payload.agency_timezone).trim();
    if (v.length > 64) errors.push("agency_timezone quá dài (tối đa 64 ký tự).");
  }

  return errors;
}

// ─────────────────────────────────────────────────────────
// Lấy danh sách — PHÂN TRANG + LỌC
// ─────────────────────────────────────────────────────────
export async function getAllAgencies({
  page = 1,
  limit = 20,
  is_active,
  keyword = "",
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;

  const where = {};

  if (typeof is_active === "boolean") where.is_active = is_active;

  if (keyword && String(keyword).trim()) {
    const kw = `%${String(keyword).trim()}%`;
    where[Op.or] = [
      { agency_name: { [Op.iLike]: kw } },
      { agency_id: { [Op.iLike]: kw } },
    ];
  }

  const { count, rows } = await Agency.findAndCountAll({
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

// ─────────────────────────────────────────────────────────
// Lấy chi tiết theo id
// ─────────────────────────────────────────────────────────
export async function getAgencyById(id) {
  const agency = await Agency.findByPk(id);
  if (!agency) {
    const err = new Error("Không tìm thấy agency.");
    err.status = 404;
    throw err;
  }
  return toPlain(agency);
}

// ─────────────────────────────────────────────────────────
// Thống kê nhanh
// ─────────────────────────────────────────────────────────
export async function getAgencyStats() {
  const [total, active, inactive] = await Promise.all([
    Agency.count(),
    Agency.count({ where: { is_active: true } }),
    Agency.count({ where: { is_active: false } }),
  ]);
  return { total, active, inactive };
}

// ─────────────────────────────────────────────────────────
// Tạo mới
// ─────────────────────────────────────────────────────────
export async function createAgency(payload = {}) {
  const errors = validatePayload(payload, { requireAll: true });
  if (errors.length) {
    const err = new Error(errors.join(" "));
    err.status = 400;
    throw err;
  }

  const agency_id = String(payload.agency_id).trim();
  const agency_name = String(payload.agency_name).trim();

  // Kiểm tra trùng agency_id
  const existed = await Agency.findOne({ where: { agency_id } });
  if (existed) {
    const err = new Error(`Mã agency_id "${agency_id}" đã tồn tại.`);
    err.status = 409;
    throw err;
  }

  const now = new Date();

  const created = await Agency.create({
    agency_id,
    agency_name,
    agency_url: payload.agency_url ? String(payload.agency_url).trim() : null,
    agency_timezone: payload.agency_timezone
      ? String(payload.agency_timezone).trim()
      : null,
    is_active: payload.is_active !== undefined ? !!payload.is_active : true,
    created_at: now,
    updated_at: now,
  });

  return toPlain(created);
}

// ─────────────────────────────────────────────────────────
// Cập nhật
// ─────────────────────────────────────────────────────────
export async function updateAgency(id, payload = {}) {
  const agency = await Agency.findByPk(id);
  if (!agency) {
    const err = new Error("Không tìm thấy agency.");
    err.status = 404;
    throw err;
  }

  const errors = validatePayload(payload, { requireAll: false });
  if (errors.length) {
    const err = new Error(errors.join(" "));
    err.status = 400;
    throw err;
  }

  const updates = {};

  if (payload.agency_id !== undefined) {
    const v = String(payload.agency_id).trim();
    if (v !== agency.agency_id) {
      const dup = await Agency.findOne({ where: { agency_id: v } });
      if (dup) {
        const err = new Error(`Mã agency_id "${v}" đã tồn tại.`);
        err.status = 409;
        throw err;
      }
    }
    updates.agency_id = v;
  }

  if (payload.agency_name !== undefined) {
    updates.agency_name = String(payload.agency_name).trim();
  }
  if (payload.agency_url !== undefined) {
    const v = payload.agency_url === null ? null : String(payload.agency_url).trim();
    updates.agency_url = v || null;
  }
  if (payload.agency_timezone !== undefined) {
    const v =
      payload.agency_timezone === null
        ? null
        : String(payload.agency_timezone).trim();
    updates.agency_timezone = v || null;
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
  await agency.update(updates);

  return await getAgencyById(id);
}

// ─────────────────────────────────────────────────────────
// Đổi trạng thái is_active (thay cho DELETE)
// ─────────────────────────────────────────────────────────
export async function changeAgencyStatus(id, is_active) {
  if (typeof is_active !== "boolean") {
    const err = new Error("is_active phải là kiểu boolean.");
    err.status = 400;
    throw err;
  }

  const agency = await Agency.findByPk(id);
  if (!agency) {
    const err = new Error("Không tìm thấy agency.");
    err.status = 404;
    throw err;
  }

  agency.is_active = is_active;
  agency.updated_at = new Date();
  await agency.save();

  return await getAgencyById(id);
}
