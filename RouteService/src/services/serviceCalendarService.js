import { Op } from "sequelize";
import ServiceCalendar from "../models/serviceCalendarModel.js";

function toPlain(r) {
  if (!r) return null;
  return r.get ? r.get({ plain: true }) : r;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export async function getAll({ page = 1, limit = 20, keyword = "" } = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const offset = (page - 1) * limit;
  const where = {};
  if (keyword && keyword.trim()) {
    where.service_id = { [Op.iLike]: `%${keyword.trim()}%` };
  }
  const { count, rows } = await ServiceCalendar.findAndCountAll({
    where, limit, offset, order: [["id", "ASC"]],
  });
  return { total: count, page, limit, totalPages: Math.ceil(count / limit), data: rows.map(toPlain) };
}

export async function getById(id) {
  const r = await ServiceCalendar.findByPk(id);
  if (!r) { const e = new Error("Không tìm thấy lịch."); e.status = 404; throw e; }
  return toPlain(r);
}

export async function create(payload = {}) {
  const { service_id, start_date, end_date } = payload;
  if (!service_id || !start_date || !end_date) {
    const e = new Error("service_id, start_date, end_date là bắt buộc."); e.status = 400; throw e;
  }
  if (new Date(end_date) < new Date(start_date)) {
    const e = new Error("end_date phải sau start_date."); e.status = 400; throw e;
  }
  const dup = await ServiceCalendar.findOne({ where: { service_id: String(service_id).trim() } });
  if (dup) { const e = new Error(`service_id "${service_id}" đã tồn tại.`); e.status = 409; throw e; }
  const data = { service_id: String(service_id).trim(), start_date, end_date };
  DAYS.forEach((d) => { data[d] = !!payload[d]; });
  return toPlain(await ServiceCalendar.create(data));
}

export async function update(id, payload = {}) {
  const r = await ServiceCalendar.findByPk(id);
  if (!r) { const e = new Error("Không tìm thấy lịch."); e.status = 404; throw e; }
  const updates = {};
  if (payload.service_id !== undefined) updates.service_id = String(payload.service_id).trim();
  if (payload.start_date !== undefined) updates.start_date = payload.start_date;
  if (payload.end_date !== undefined) updates.end_date = payload.end_date;
  DAYS.forEach((d) => { if (payload[d] !== undefined) updates[d] = !!payload[d]; });
  if (Object.keys(updates).length === 0) {
    const e = new Error("Không có trường nào để cập nhật."); e.status = 400; throw e;
  }
  await r.update(updates);
  return getById(id);
}

export async function remove(id) {
  const r = await ServiceCalendar.findByPk(id);
  if (!r) { const e = new Error("Không tìm thấy lịch."); e.status = 404; throw e; }
  await r.destroy();
  return { id: Number(id) };
}
