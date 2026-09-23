// API client cho module mô phỏng
import axios from "axios";

// Tạo instance axios với baseURL lấy từ .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/tbus",
  timeout: 15000,
});

// Interceptor để log lỗi tập trung
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API Error]", err?.response?.data || err.message);
    return Promise.reject(err);
  },
);

/**
 * Lấy dữ liệu nhiều chuyến cùng hướng (GO / RETURN)
 * @param {string} direction - 'go' | 'return'
 * @param {number} limit - số chuyến tối đa
 */
export async function fetchSimulationBatch(direction, limit = 30) {
  const res = await api.get("/simulation/batch", {
    params: { direction, limit },
  });
  return res.data;
}
