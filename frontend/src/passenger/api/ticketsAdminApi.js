import axios from "axios";

const api = axios.create({
  baseURL: "/passenger-api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pax_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function verifyTicketQr(payload) {
  const res = await api.post("/tickets/verify", payload);
  return res.data;
}
