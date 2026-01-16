import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";
import api, { setAuthToken } from "../API/api";
import { SwalError } from "../utils/SwalAlert";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userMenus, setUserMenus] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authType, setAuthType] = useState(null); // 'admin' or 'employee'

  // Logout function
  const logout = useCallback(async () => {
    //alert(authType);
    if (authType === "admin") {
      // Admin: clear HttpOnly cookie
      try {
        await api.post("/api/auth/logout");
      } catch (error) {
        console.error("Logout error:", error);
      }
    } else {
      // Employee: clear localStorage
      localStorage.removeItem("accessToken");
      setAuthToken(null); // ← Clear Authorization header
    }

    setUser(null);
    setUserMenus([]);
    setToken(null);
    setAuthType(null);
  }, [authType]);

  // Initialize authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("accessToken");

      if (savedToken) {
        // Employee auth (localStorage JWT)
        try {
          const payload = jwtDecode(savedToken);
          const now = Date.now() / 1000;

          if (payload.exp && payload.exp < now) {
            localStorage.removeItem("accessToken");
            setAuthToken(null);
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
          setAuthType("employee");
          setAuthToken(savedToken);
        } catch (error) {
          console.error("Token decode error:", error);
          localStorage.removeItem("accessToken");
          setAuthToken(null);
        }
      } else {
        // No localStorage token, check for Admin session (HttpOnly cookie)
        try {
          const response = await api.get("/api/auth/me");
          setUser(response.data.user);
          setUserMenus(response.data.menus);
          setAuthType("admin");
          setAuthToken(null); // No header needed for admin (uses cookie)
        } catch (error) {
          // Silently fail - no admin session found
          if (error.response?.status !== 401) {
            //console.error("Auth check error:", error);
          }
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Auto-logout when employee token expires
  useEffect(() => {
    if (authType !== "employee" || !user?.exp) return;

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
  }, [user?.exp, authType, logout]);

  // Admin/Employee login
  const login = useCallback(async (username, password, remember = false) => {
    try {
      const resp = await api.post("/api/auth/login", { username, password });

      if (resp.data.token) {
        // Employee login response
        const token = resp.data.token;
        localStorage.setItem("accessToken", token);
        setAuthToken(token); // ← Set Authorization header

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
        setAuthType("employee");
        return authUser;
      } else {
        // Admin login response (HttpOnly cookie)
        setUser(resp.data.user);
        setUserMenus(resp.data.menus);
        setAuthType("admin");
        setAuthToken(null); // ← No header needed, cookie handles it
        return resp.data.user;
      }
    } catch (error) {
      console.error("Login error:", error);
      SwalError("Error", error.response?.data || "Login failed");
      throw error;
    }
  }, []);

  const createToken = useCallback((token) => {
    try {
      localStorage.setItem("accessToken", token);
      setAuthToken(token); // ← Set Authorization header

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
      setAuthType("employee");

      return authUser;
    } catch (error) {
      console.error("Token creation error:", error);
      throw error;
    }
  }, []);

  // Memoize context value
  const value = useMemo(
    () => ({
      user,
      userMenus,
      token,
      loading,
      authType,
      login,
      createToken,
      logout,
    }),
    [user, userMenus, token, loading, authType, login, createToken, logout]
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
