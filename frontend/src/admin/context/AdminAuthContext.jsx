import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const AdminAuthContext = createContext(null);

const TOKEN_KEY = "admin_access_token";
const USER_KEY = "admin_user";

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    axios
      .get("/passenger-api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.roles?.includes("ADMIN")) {
          setUser(res.data);
        } else {
          throw new Error("Không có quyền Admin");
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await axios.post("/passenger-api/auth/login", {
      username,
      password,
    });
    const data = res.data;

    if (!data.user.roles?.includes("ADMIN")) {
      throw new Error("Tài khoản này không có quyền truy cập Admin.");
    }

    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
