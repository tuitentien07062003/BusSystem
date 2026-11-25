import api from "./client";

export async function listFavorites({ type } = {}) {
  const params = {};
  if (type) params.type = type;
  const res = await api.get("/me/favorites", { params });
  return res.data;
}

export async function addFavorite({ type, target_id }) {
  const res = await api.post("/me/favorites", { type, target_id });
  return res.data;
}

export async function removeFavorite(id) {
  const res = await api.delete(`/me/favorites/${id}`);
  return res.data;
}

export async function listSearchHistory({ limit = 30 } = {}) {
  const res = await api.get("/me/search-history", { params: { limit } });
  return res.data;
}

export async function addSearchHistory(payload) {
  const res = await api.post("/me/search-history", payload);
  return res.data;
}

export async function clearSearchHistory() {
  const res = await api.delete("/me/search-history");
  return res.data;
}

export async function listFeedbacks({ limit = 30 } = {}) {
  const res = await api.get("/me/feedbacks", { params: { limit } });
  return res.data;
}

export async function createFeedback(payload) {
  const res = await api.post("/me/feedbacks", payload);
  return res.data;
}
