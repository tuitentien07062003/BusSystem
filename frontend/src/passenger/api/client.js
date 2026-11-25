import axios from "axios";

const api = axios.create({
  baseURL: "/passenger-api",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pax_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("pax_access_token");
      localStorage.removeItem("pax_refresh_token");
      localStorage.removeItem("pax_user");

      if (
        window.location.pathname.startsWith("/passenger") &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/passenger/login";
      }
    }
    return Promise.reject(err);
  },
);

export default api;
