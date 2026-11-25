import crypto from "crypto";
import { Ticket } from "../models/index.js";

const CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const API_KEY = process.env.PAYOS_API_KEY;
const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;
const ENDPOINT = process.env.PAYOS_ENDPOINT || "https://api-merchant.payos.vn";
const RETURN_URL = process.env.PAYOS_RETURN_URL;
const CANCEL_URL = process.env.PAYOS_CANCEL_URL;

const PRICES = {
  single: { normal: 7000, student: 3500 },
  bundle: { normal: 175000, student: 87500 },
  monthly: { normal: 250000, student: 125000 },
};
const USES = { single: 1, bundle: 30, monthly: 999999 };
const EXPIRES_DAYS = { single: 1, bundle: 30, monthly: 30 };

function computePrice(ticketType, isStudent) {
  const p = PRICES[ticketType];
  if (!p) {
    const err = new Error("Loại vé không hợp lệ.");
    err.status = 400;
    throw err;
  }
  return isStudent ? p.student : p.normal;
}

function generateOrderCode() {
  return Date.now();
}

function sanitizeDescription(ticketType, isStudent) {
  const label =
    ticketType === "single"
      ? "Ve luot"
      : ticketType === "bundle"
        ? "Ve tap 30"
        : "Ve thang";
  return `TBus ${label}${isStudent ? " SV" : ""}`.slice(0, 25);
}

function signCreatePayment({
  amount,
  cancelUrl,
  description,
  orderCode,
  returnUrl,
}) {
  const raw =
    `amount=${amount}` +
    `&cancelUrl=${cancelUrl}` +
    `&description=${description}` +
    `&orderCode=${orderCode}` +
    `&returnUrl=${returnUrl}`;
  return crypto.createHmac("sha256", CHECKSUM_KEY).update(raw).digest("hex");
}

function signCancelPayment({ orderCode, cancellationReason }) {
  const raw = `cancellationReason=${cancellationReason}&orderCode=${orderCode}`;
  return crypto.createHmac("sha256", CHECKSUM_KEY).update(raw).digest("hex");
}

export async function createPaymentLink({ userId, ticketType, isStudent }) {
  if (!CLIENT_ID || !API_KEY || !CHECKSUM_KEY) {
    const err = new Error("PayOS chưa được cấu hình (thiếu env).");
    err.status = 500;
    throw err;
  }

  const price = computePrice(ticketType, isStudent);
  const orderCode = generateOrderCode();
  const description = sanitizeDescription(ticketType, isStudent);

  const ticket = await Ticket.create({
    user_id: userId,
    ticket_type: ticketType,
    is_student: !!isStudent,
    price,
    remaining_uses: 0,
    status: "pending",
    payment_status: "pending",
    payment_method: "payos",
    payos_order_code: orderCode,
    qr_code: null,
    created_at: new Date(),
  });

  const signature = signCreatePayment({
    amount: price,
    cancelUrl: CANCEL_URL,
    description,
    orderCode,
    returnUrl: RETURN_URL,
  });

  let data;
  try {
    const res = await fetch(`${ENDPOINT}/v2/payment-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CLIENT_ID,
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({
        orderCode,
        amount: price,
        description,
        returnUrl: RETURN_URL,
        cancelUrl: CANCEL_URL,
        signature,
      }),
    });
    data = await res.json();
  } catch (err) {
    await ticket.update({ status: "cancelled", payment_status: "failed" });
    const e = new Error("Không kết nối được PayOS.");
    e.status = 502;
    throw e;
  }

  if (data.code !== "00") {
    await ticket.update({ status: "cancelled", payment_status: "failed" });
    const e = new Error(
      `PayOS: ${data.desc || data.message || "Tạo link thất bại"}`,
    );
    e.status = 502;
    throw e;
  }

  return {
    ticket_id: ticket.id,
    order_code: orderCode,
    checkout_url: data.data.checkoutUrl,
    qr_code: data.data.qrCode,
    amount: price,
    payment_link_id: data.data.paymentLinkId,
  };
}

export async function getPaymentInfo(orderCode) {
  const res = await fetch(`${ENDPOINT}/v2/payment-requests/${orderCode}`, {
    headers: {
      "x-client-id": CLIENT_ID,
      "x-api-key": API_KEY,
    },
  });
  const data = await res.json();
  if (data.code !== "00") {
    const err = new Error(`PayOS: ${data.desc || "Không lấy được thông tin"}`);
    err.status = 502;
    throw err;
  }
  return data.data;
}

export async function confirmFromPayos(orderCode) {
  const ticket = await Ticket.findOne({
    where: { payos_order_code: orderCode },
  });

  if (!ticket) {
    const err = new Error("Không tìm thấy giao dịch.");
    err.status = 404;
    throw err;
  }

  if (ticket.payment_status === "paid") return ticket;

  const info = await getPaymentInfo(orderCode);

  if (info.status === "PAID") {
    const uses = USES[ticket.ticket_type] ?? 1;
    const days = EXPIRES_DAYS[ticket.ticket_type] ?? 1;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const qr_code = `TB-${ticket.id}-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    await ticket.update({
      status: "active",
      payment_status: "paid",
      remaining_uses: uses,
      paid_at: new Date(),
      expires_at: expiresAt,
      qr_code,
    });
    return ticket;
  }

  if (info.status === "CANCELLED") {
    await ticket.update({
      status: "cancelled",
      payment_status: "cancelled",
    });
    return ticket;
  }

  return ticket;
}

export async function cancelPayment(orderCode, reason = "User cancelled") {
  const ticket = await Ticket.findOne({
    where: { payos_order_code: orderCode },
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

  try {
    const signature = signCancelPayment({
      orderCode,
      cancellationReason: reason,
    });
    await fetch(`${ENDPOINT}/v2/payment-requests/${orderCode}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CLIENT_ID,
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ cancellationReason: reason, signature }),
    });
  } catch (e) {
    console.warn("[payos cancel] API fail, vẫn update local:", e.message);
  }

  await ticket.update({
    status: "cancelled",
    payment_status: "cancelled",
  });
  return ticket;
}

export function verifyWebhookSignature(data, signature) {
  if (!data || !signature) return false;
  const sortedKeys = Object.keys(data).sort();
  const raw = sortedKeys.map((k) => `${k}=${data[k]}`).join("&");
  const expected = crypto
    .createHmac("sha256", CHECKSUM_KEY)
    .update(raw)
    .digest("hex");
  return expected === signature;
}
