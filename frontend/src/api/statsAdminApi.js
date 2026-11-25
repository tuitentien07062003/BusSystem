import axios from "axios";

const api = axios.create({ baseURL: "/passenger-api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getOverview() {
  const res = await api.get("/admin/stats/overview");
  return res.data;
}

export async function getRevenue(days = 30) {
  const res = await api.get("/admin/stats/revenue", { params: { days } });
  return res.data;
}

export async function getTicketBreakdown() {
  const res = await api.get("/admin/stats/tickets");
  return res.data;
}

export async function getFeedbackBreakdown() {
  const res = await api.get("/admin/stats/feedbacks");
  return res.data;
}

export async function getRecentActivity(limit = 10) {
  const res = await api.get("/admin/stats/recent", { params: { limit } });
  return res.data;
}
