import crypto from "crypto";
import { Ticket } from "../models/index.js";

const PRICES = {
  single: { normal: 7000, student: 3500 },
  bundle: { normal: 175000, student: 87500 },
  monthly: { normal: 250000, student: 125000 },
};

const USES = {
  single: 1,
  bundle: 30,
  monthly: 999999,
};

const EXPIRES_DAYS = {
  single: 1,
  bundle: 30,
  monthly: 30,
};

const VALID_METHODS = ["momo", "zalopay"];

function computePrice(ticket_type, is_student) {
  const p = PRICES[ticket_type];
  if (!p) {
    const err = new Error("Loại vé không hợp lệ.");
    err.status = 400;
    throw err;
  }
  return is_student ? p.student : p.normal;
}

function genRef(method) {
  const rand = crypto.randomBytes(4).toString("hex");
  return `MOCK_${method.toUpperCase()}_${Date.now()}_${rand}`;
}

export async function initiatePayment(userId, payload = {}) {
  const { ticket_type, is_student, payment_method } = payload;

  if (!VALID_METHODS.includes(payment_method)) {
    const err = new Error("Phương thức thanh toán không hợp lệ.");
    err.status = 400;
    throw err;
  }

  const price = computePrice(ticket_type, is_student);
  const payment_ref = genRef(payment_method);

  const ticket = await Ticket.create({
    user_id: userId,
    ticket_type,
    is_student: !!is_student,
    price,
    remaining_uses: 0,
    status: "pending",
    payment_status: "pending",
    payment_method,
    payment_ref,
    created_at: new Date(),
  });

  return {
    ticket_id: ticket.id,
    payment_ref,
    payment_method,
    price,
    ticket_type,
  };
}

export async function confirmPayment(userId, payment_ref) {
  const ticket = await Ticket.findOne({
    where: { payment_ref, user_id: userId },
  });

  if (!ticket) {
    const err = new Error("Không tìm thấy giao dịch.");
    err.status = 404;
    throw err;
  }

  if (ticket.payment_status === "paid") {
    return ticket;
  }

  if (ticket.payment_status !== "pending") {
    const err = new Error("Giao dịch không ở trạng thái chờ.");
    err.status = 400;
    throw err;
  }

  const uses = USES[ticket.ticket_type] ?? 1;
  const days = EXPIRES_DAYS[ticket.ticket_type] ?? 1;
  const expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await ticket.update({
    status: "active",
    payment_status: "paid",
    remaining_uses: uses,
    paid_at: new Date(),
    expires_at,
  });

  return ticket;
}

export async function cancelPayment(userId, payment_ref) {
  const ticket = await Ticket.findOne({
    where: { payment_ref, user_id: userId },
  });

  if (!ticket) {
    const err = new Error("Không tìm thấy giao dịch.");
    err.status = 404;
    throw err;
  }

  if (ticket.payment_status === "paid") {
    const err = new Error("Giao dịch đã thanh toán, không thể huỷ.");
    err.status = 400;
    throw err;
  }

  await ticket.update({
    status: "cancelled",
    payment_status: "cancelled",
  });

  return ticket;
}
