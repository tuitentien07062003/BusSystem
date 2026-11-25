import api from "./client";

export async function submitStudentVerify(payload) {
  const res = await api.post("/me/students/verify", payload);
  return res.data;
}

export async function getMyStudentVerify() {
  const res = await api.get("/me/students/verify");
  return res.data;
}

export async function checkStudentEligibility() {
  const res = await api.get("/me/students/eligibility");
  return res.data;
}

export async function purchaseTicket(payload) {
  const res = await api.post("/me/tickets", payload);
  return res.data;
}

export async function listMyTickets({ status } = {}) {
  const params = {};
  if (status) params.status = status;
  const res = await api.get("/me/tickets", { params });
  return res.data;
}

export async function getTicketDetail(id) {
  const res = await api.get(`/me/tickets/${id}`);
  return res.data;
}

export async function cancelTicket(id) {
  const res = await api.post(`/me/tickets/${id}/cancel`);
  return res.data;
}

export async function verifyQr(payload) {
  const res = await api.post("/tickets/verify", payload);
  return res.data;
}

export async function payosCheckout(payload) {
  const res = await api.post("/me/tickets/checkout", payload);
  return res.data;
}

export async function payosPoll(order_code) {
  const res = await api.post("/me/tickets/checkout/poll", { order_code });
  return res.data;
}

export async function payosCancel(order_code) {
  const res = await api.post("/me/tickets/checkout/cancel", { order_code });
  return res.data;
}
