import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLEET_API_BASE_URL || "/fleet",
  timeout: 15000,
});

export async function fetchShiftTemplates({ is_active } = {}) {
  const params = {};
  if (typeof is_active === "boolean") params.is_active = is_active;
  const res = await api.get("/shift-templates", { params });
  return res.data;
}

export async function fetchActiveShiftTemplates() {
  const res = await api.get("/shift-templates/active");
  return res.data;
}

export async function fetchShiftTemplateById(id) {
  const res = await api.get(`/shift-templates/${id}`);
  return res.data;
}
