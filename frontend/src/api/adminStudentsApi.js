import axios from "axios";

const api = axios.create({ baseURL: "/passenger-api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getStudentVerifications({
  status = "pending",
  q = "",
  page = 1,
  limit = 50,
}) {
  const res = await api.get("/admin/students", {
    params: { status, q, page, limit },
  });
  return res.data;
}

export async function verifyStudent(id, payload) {
  const res = await api.patch(`/admin/students/${id}/verify`, payload);
  return res.data;
}
