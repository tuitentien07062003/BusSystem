import { TripFeedback } from "../models/index.js";

function normalizeFeedback(instance) {
  if (!instance) return null;
  const o = instance.get ? instance.get({ plain: true }) : instance;
  return {
    ...o,
    // DB dùng cột `comment`, FE/API contract dùng `content`
    content: o.comment ?? o.content ?? "",
    images: Array.isArray(o.images)
      ? o.images
      : typeof o.images === "string"
        ? (() => {
            try {
              return JSON.parse(o.images);
            } catch {
              return [];
            }
          })()
        : [],
  };
}

export async function createFeedback(userId, payload = {}) {
  console.log("[createFeedback] CALLED. payload.content =", payload.content);
  const { route_id, full_name, email, phone, content, images } = payload;
  console.log("[createFeedback] content after destructure =", content);

  const errors = [];
  if (!full_name || String(full_name).trim().length < 2)
    errors.push("Họ tên không hợp lệ.");
  if (!content || String(content).trim().length < 10)
    errors.push("Nội dung tối thiểu 10 ký tự.");
  if (images && images.length > 3) errors.push("Tối đa 3 ảnh.");

  if (errors.length > 0) {
    const err = new Error(errors.join(" "));
    err.status = 400;
    throw err;
  }

  const created = await TripFeedback.create({
    user_id: userId || null,
    type: "general",
    route_id: route_id ? parseInt(route_id) : null,
    full_name: String(full_name).trim(),
    email: email ? String(email).trim().toLowerCase() : null,
    phone: phone ? String(phone).trim() : null,
    comment: String(content).trim(),
    images: images || [],
    status: "new",
    created_at: new Date(),
  });

  return normalizeFeedback(created);
}

export async function listFeedbacks({ status, page = 1, limit = 20 } = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 100);
  const offset = (page - 1) * limit;

  const where = { type: "general" };
  if (status && ["new", "reviewed", "resolved"].includes(status)) {
    where.status = status;
  }

  const { count, rows } = await TripFeedback.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    attributes: [
      "id",
      "user_id",
      "type",
      "route_id",
      "full_name",
      "email",
      "phone",
      "comment",
      "images",
      "status",
      "admin_note",
      "reviewed_by",
      "reviewed_at",
      "created_at",
    ],
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(normalizeFeedback),
  };
}

export async function updateFeedbackStatus(
  id,
  adminId,
  { status, admin_note } = {},
) {
  if (!["new", "reviewed", "resolved"].includes(status)) {
    const err = new Error("Trạng thái không hợp lệ.");
    err.status = 400;
    throw err;
  }

  const fb = await TripFeedback.findOne({ where: { id, type: "general" } });
  if (!fb) {
    const err = new Error("Không tìm thấy góp ý.");
    err.status = 404;
    throw err;
  }

  await fb.update({
    status,
    admin_note: admin_note || null,
    reviewed_by: adminId,
    reviewed_at: new Date(),
  });

  return normalizeFeedback(fb);
}
