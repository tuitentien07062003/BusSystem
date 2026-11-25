import crypto from "crypto";
import { Op } from "sequelize";
import { Ticket, TicketUsageLog } from "../models/index.js";
import { checkStudentEligibility } from "./studentVerificationService.js";

const PRICES = {
  single: { normal: 7000, student: 3500, uses: 1 },
  bundle: { normal: 175000, student: 87500, uses: 30 },
  monthly: { normal: 250000, student: 125000, uses: 999999 },
};

const DURATION_DAYS = 30;

function toPlain(instance) {
  return instance ? instance.get({ plain: true }) : null;
}

function generateQrCode() {
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `TB-${rand}-${ts}`;
}

export async function purchaseTicket(
  userId,
  { ticket_type, is_student = false } = {},
) {
  if (!ticket_type || !PRICES[ticket_type]) {
    const err = new Error("ticket_type phải là single, bundle hoặc monthly.");
    err.status = 400;
    throw err;
  }

  const pricing = PRICES[ticket_type];
  let price = pricing.normal;

  if (is_student) {
    const eligibility = await checkStudentEligibility(userId);
    if (!eligibility.eligible) {
      const err = new Error(
        `Không thể mua vé sinh viên: ${eligibility.reason}`,
      );
      err.status = 403;
      throw err;
    }
    price = pricing.student;
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + DURATION_DAYS);

  const created = await Ticket.create({
    user_id: userId,
    ticket_type,
    is_student: !!is_student,
    qr_code: generateQrCode(),
    price,
    status: "active",
    purchased_at: now,
    expires_at: expires,
    total_uses: pricing.uses,
    remaining_uses: pricing.uses,
    last_used_at: null,
    created_at: now,
  });

  return toPlain(created);
}

export async function listMyTickets(userId, { status } = {}) {
  const where = { user_id: userId };
  if (status && ["active", "used", "expired", "cancelled"].includes(status)) {
    where.status = status;
  }

  const rows = await Ticket.findAll({
    where,
    order: [["purchased_at", "DESC"]],
  });
  return rows.map(toPlain);
}

export async function getTicketDetail(userId, ticketId) {
  const t = await Ticket.findOne({
    where: { id: ticketId, user_id: userId },
    include: [{ model: TicketUsageLog, as: "usage_logs", required: false }],
  });
  if (!t) {
    const err = new Error("Không tìm thấy vé.");
    err.status = 404;
    throw err;
  }
  const plain = toPlain(t);
  plain.usage_logs = (plain.usage_logs || []).map((u) => ({
    id: u.id,
    trip_id: u.trip_id,
    vehicle_id: u.vehicle_id,
    route_id: u.route_id,
    scanned_at: u.scanned_at,
    location_lat: u.location_lat ? parseFloat(u.location_lat) : null,
    location_lng: u.location_lng ? parseFloat(u.location_lng) : null,
  }));
  return plain;
}

export async function verifyQr(
  scannedBy,
  { qr_code, trip_id, vehicle_id, route_id, lat, lng } = {},
) {
  if (!qr_code || !String(qr_code).trim()) {
    const err = new Error("qr_code là bắt buộc.");
    err.status = 400;
    throw err;
  }

  const ticket = await Ticket.findOne({
    where: { qr_code: String(qr_code).trim() },
  });
  if (!ticket) {
    return { valid: false, reason: "Vé không tồn tại." };
  }

  const t = toPlain(ticket);

  if (t.status === "cancelled") {
    return { valid: false, reason: "Vé đã bị hủy." };
  }
  if (t.status === "used") {
    return { valid: false, reason: "Vé đã được sử dụng hết lượt." };
  }
  if (
    t.status === "expired" ||
    (t.expires_at && new Date(t.expires_at) < new Date())
  ) {
    if (t.status !== "expired") {
      await ticket.update({ status: "expired" });
    }
    return { valid: false, reason: "Vé đã hết hạn." };
  }
  if (t.remaining_uses <= 0) {
    return { valid: false, reason: "Vé đã hết lượt sử dụng." };
  }

  const newRemaining = t.remaining_uses - 1;
  const newStatus = newRemaining <= 0 ? "used" : "active";
  const now = new Date();

  await ticket.update({
    remaining_uses: newRemaining,
    status: newStatus,
    last_used_at: now,
  });

  const log = await TicketUsageLog.create({
    ticket_id: ticket.id,
    trip_id: trip_id ? parseInt(trip_id) : null,
    vehicle_id: vehicle_id ? parseInt(vehicle_id) : null,
    route_id: route_id ? parseInt(route_id) : null,
    scanned_by: scannedBy,
    scanned_at: now,
    location_lat: lat ? parseFloat(lat) : null,
    location_lng: lng ? parseFloat(lng) : null,
    created_at: now,
  });

  return {
    valid: true,
    ticket: {
      id: ticket.id,
      ticket_type: t.ticket_type,
      is_student: t.is_student,
      qr_code: t.qr_code,
      remaining_uses: newRemaining,
      status: newStatus,
      expires_at: t.expires_at,
    },
    usage_log_id: log.id,
  };
}

export async function cancelTicket(userId, ticketId) {
  const ticket = await Ticket.findOne({
    where: { id: ticketId, user_id: userId },
  });
  if (!ticket) {
    const err = new Error("Không tìm thấy vé.");
    err.status = 404;
    throw err;
  }
  if (ticket.status !== "active") {
    const err = new Error("Chỉ có thể hủy vé đang active.");
    err.status = 409;
    throw err;
  }
  if (ticket.remaining_uses < ticket.total_uses) {
    const err = new Error("Vé đã được sử dụng, không thể hủy.");
    err.status = 409;
    throw err;
  }
  await ticket.update({ status: "cancelled" });
  return { id: ticket.id, status: "cancelled" };
}
