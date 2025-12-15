import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../API/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      const payload = jwtDecode(token);
      return { username: payload.unique_name || payload.name || payload.sub, role: payload.role, exp: payload.exp };
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // optional: handle token expiry, auto logout
    if (!user) return;
    const now = Math.floor(Date.now() / 1000);
    if (user.exp && user.exp < now) {
      logout();
    }
  }, []);

  const login = async (username, password, remember = false) => {
    const resp = await api.post("/api/auth/login", { username, password });
    const token = resp.data.token;
    if (!token) throw new Error("Token missing from response");
    localStorage.setItem("accessToken", token);
    if (!remember) {
      // For better security you could store in sessionStorage instead of localStorage for non-remember
      // sessionStorage.setItem("accessToken", token);
    }
    const payload = jwtDecode(token);
    setUser({ username: payload.unique_name || payload.name || payload.sub, role: payload.role, exp: payload.exp });
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    // sessionStorage.removeItem("accessToken");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export default AuthContext;