import React, { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../API/api";
import { SwalError } from "../utils/SwalAlert";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    if (savedToken) {
      try {
        const payload = jwtDecode(savedToken);
        setUser({
          empID: payload.EmpID,
          email: payload.email,
          name: payload.unique_name || payload.name || payload.sub,
          role: payload.Role || payload.role,
          exp: payload.exp,
        });
        setToken(savedToken);
      } catch {
        localStorage.removeItem("accessToken");
      }
    }
    setLoading(false);
  }, []);

  // Auto-logout exactly when token expires
  useEffect(() => {
    if (!user?.exp) return;

    const now = Date.now() / 1000;
    const timeLeft = user.exp - now;

    if (timeLeft <= 0) {
      SwalError(
        "Session Expired",
        "Your session has expired. Please log in again."
      );
      logout();
      return;
    }

    const timer = setTimeout(() => {
      SwalError(
        "Session Expired",
        "Your session has expired. Please log in again."
      );
      logout();
    }, timeLeft * 1000);

    return () => clearTimeout(timer);
  }, [user]);

  // Admin login
  const login = async (username, password, remember = false) => {
    const resp = await api.post("/api/auth/login", { username, password });
    const token = resp.data.token;
    if (!token) SwalError("Error", "Token missing"); // throw new Error("Token missing");

    localStorage.setItem("accessToken", token);
    const payload = jwtDecode(token);
    const authUser = {
      empID: payload.EmpID,
      email: payload.email,
      name: payload.unique_name || payload.name || payload.sub,
      role: payload.Role || payload.role,
      exp: payload.exp,
    };
    setUser(authUser);
    setToken(token);
  };

  // Employee login / verify IDNo
  const createToken = (token) => {
    localStorage.setItem("accessToken", token);
    const payload = jwtDecode(token);
    const authUser = {
      name: payload.unique_name || payload.name || payload.sub,
      empID: payload.EmpID,
      email: payload.email,
      role: payload.role,
      exp: payload.exp,
    };
    setUser(authUser);
    setToken(token);
    return authUser;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, createToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
