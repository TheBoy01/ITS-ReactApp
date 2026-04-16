// contexts/AuthContext.jsx

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
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
  const [authType, setAuthType] = useState(null);
  const [empPages, setEmpPages] = useState([]);

  // ── LOGOUT ──────────────────────────────────────────────────
  const logout = useCallback(async () => {
    localStorage.removeItem("accessToken");
    // ✅ No more emp_pages in localStorage
    setAuthToken(null);

    try {
      await api.post("/api/Auth/logout");
    } catch {}

    setUser(null);
    setUserMenus([]);
    setToken(null);
    setAuthType(null);
    setEmpPages([]);
  }, [authType]);

  // ── CHECK AUTH ON MOUNT ─────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("accessToken");

      if (savedToken) {
        try {
          const payload = jwtDecode(savedToken);
          const now = Date.now() / 1000;

          if (payload.exp && payload.exp < now) {
            localStorage.removeItem("accessToken");
            setAuthToken(null);
            setLoading(false);
            return;
          }

          if (!payload.UserId && !payload.EmpID && !payload.nameid) {
            localStorage.removeItem("accessToken");
            setAuthToken(null);
            setLoading(false);
            return;
          }

          setAuthToken(savedToken);
          setToken(savedToken);

          const isAdmin = payload.RoleId && payload.menu;

          if (isAdmin) {
            setUser({
              empID: payload.UserId,
              email: payload.email,
              empCode: payload.nameid,
              name: payload.unique_name || payload.name,
              role: payload.Role || payload.role,
              exp: payload.exp,
              position: payload.Position,
            });
            setAuthType("admin");

            try {
              const response = await api.get("/api/auth/menus");
              setUserMenus(response.data);
            } catch (error) {
              if (error.response?.status === 401) {
                localStorage.removeItem("accessToken");
                setAuthToken(null);
                setUser(null);
                setAuthType(null);
                setUserMenus([]);
              }
            }
          } else {
            // ✅ Employee — read pages directly from JWT claim
            const pages = payload.Pages ? JSON.parse(payload.Pages) : [];

            setUser({
              empID: payload.EmpID || payload.nameid,
              email: payload.email,
              name: payload.unique_name || payload.name || payload.sub,
              role: payload.Role || payload.role,
              exp: payload.exp,
              position: payload.Position,
            });
            setAuthType("employee");
            setUserMenus([]);
            setEmpPages(pages); // ✅ from JWT, not localStorage
          }
        } catch (error) {
          console.error("Token decode error:", error);
          localStorage.removeItem("accessToken");
          setAuthToken(null);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // ── AUTO LOGOUT ON EXPIRY ───────────────────────────────────
  useEffect(() => {
    if (!user?.exp) return;
    const now = Date.now() / 1000;
    const timeLeft = user.exp - now;
    if (timeLeft <= 0) {
      logout();
      return;
    }
    const timer = setTimeout(() => {
      SwalError(
        "Session Expired",
        "Your session has expired. Please log in again.",
      );
      logout();
    }, timeLeft * 1000);
    return () => clearTimeout(timer);
  }, [user?.exp, logout]);

  // ── ADMIN LOGIN ─────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    try {
      const resp = await api.post("/api/auth/login", { username, password });
      const token = resp.data.token;
      if (!token) throw new Error("Token missing from response");

      localStorage.setItem("accessToken", token);
      setAuthToken(token);
      setToken(token);

      const payload = jwtDecode(token);

      if (resp.data.menus && resp.data.menus.length > 0) {
        const authUser = {
          empID: payload.UserId || payload.nameid,
          empCode: payload.nameid,
          name: payload.unique_name || payload.name,
          role: resp.data.user.role,
          exp: payload.exp,
          position: payload.Position,
        };
        setUser(authUser);
        setUserMenus(resp.data.menus);
        setAuthType("admin");
        return authUser;
      }
    } catch (error) {
      SwalError("Error", error.response?.data || "Login failed");
      throw error;
    }
  }, []);

  // ── EMPLOYEE LOGIN (VerifyIDNo) ─────────────────────────────
  const createToken = useCallback((token) => {
    // ✅ No pages parameter — read directly from JWT
    const decoded = jwtDecode(token);
    const pages = decoded.Pages ? JSON.parse(decoded.Pages) : [];

    const userData = {
      empID: decoded.EmpID,
      name: decoded.unique_name,
      email: decoded.email,
      position: decoded.Position,
      role: decoded.RoleId,
      exp: decoded.exp,
    };

    localStorage.setItem("accessToken", token); // ✅ only token stored
    setAuthToken(token);
    setToken(token);
    setUser(userData);
    setEmpPages(pages); // ✅ from JWT claim
    setAuthType("employee");
    return userData;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authType,
        userMenus,
        token,
        loading,
        empPages,
        login,
        createToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export default AuthContext;
