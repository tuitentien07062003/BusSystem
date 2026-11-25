import api from "./client";

export async function register(payload) {
  const res = await api.post("/auth/register", payload);
  return res.data;
}

export async function login(payload) {
  const res = await api.post("/auth/login", payload);
  return res.data;
}

export async function refreshToken(refresh_token) {
  const res = await api.post("/auth/refresh", { refresh_token });
  return res.data;
}

export async function logout(refresh_token) {
  const res = await api.post("/auth/logout", { refresh_token });
  return res.data;
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

export async function updateProfile(payload) {
  const res = await api.put("/auth/me", payload);
  return res.data;
}

export async function changePassword(payload) {
  const res = await api.post("/auth/change-password", payload);
  return res.data;
}
