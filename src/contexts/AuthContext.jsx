import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";
import api from "../API/api";
import { SwalError } from "../utils/SwalAlert";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logout function - use useCallback to memoize it
  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setToken(null);
  }, []);

  // Initialize user from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    if (savedToken) {
      try {
        const payload = jwtDecode(savedToken);

        // Check if token is already expired
        const now = Date.now() / 1000;
        if (payload.exp && payload.exp < now) {
          localStorage.removeItem("accessToken");
          setLoading(false);
          return;
        }
        const authUser = {
          empID: payload.EmpID || payload.nameid,
          email: payload.email,
          name: payload.unique_name || payload.name || payload.sub,
          role: payload.Role || payload.role,
          exp: payload.exp,
        };

        setUser(authUser);
        setToken(savedToken);
      } catch (error) {
        console.error("Token decode error:", error);
        localStorage.removeItem("accessToken");
      }
    }
    setLoading(false);
  }, []);

  // Auto-logout when token expires
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
  }, [user?.exp, logout]); // Now logout is stable

  // Admin login
  const login = useCallback(async (username, password, remember = false) => {
    try {
      const resp = await api.post("/api/auth/login", { username, password });
      const token = resp.data.token;

      if (!token) {
        SwalError("Error", "Token missing");
        throw new Error("Token missing");
      }

      localStorage.setItem("accessToken", token);
      const payload = jwtDecode(token);

      const authUser = {
        empID: payload.EmpID || payload.nameid,
        email: payload.email,
        name: payload.unique_name || payload.name || payload.sub,
        role: payload.Role || payload.role,
        exp: payload.exp,
      };

      setUser(authUser);
      setToken(token);

      return authUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }, []);

  // Employee login / verify IDNo
  const createToken = useCallback((token) => {
    try {
      localStorage.setItem("accessToken", token);
      const payload = jwtDecode(token);

      const authUser = {
        empID: payload.EmpID || payload.nameid,
        email: payload.email,
        name: payload.unique_name || payload.name || payload.sub,
        role: payload.Role || payload.role,
        exp: payload.exp,
      };

      setUser(authUser);
      setToken(token);

      return authUser;
    } catch (error) {
      console.error("Token creation error:", error);
      throw error;
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      createToken,
      logout,
    }),
    [user, token, loading, login, createToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
