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
    // Clear localStorage and token
    localStorage.removeItem("accessToken");
    setAuthToken(null);

    // Call backend logout if admin (to clear menu cache)
    if (authType === "admin") {
      try {
        await api.post("/api/auth/logout");
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    // Reset all state
    setUser(null);
    setUserMenus([]);
    setToken(null);
    setAuthType(null);
  }, [authType]);

  // Initialize authentication on mount
  // In your AuthContext, update checkAuth
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("accessToken");

      if (savedToken) {
        try {
          const payload = jwtDecode(savedToken);
          const now = Date.now() / 1000;

          // Check if token is expired
          if (payload.exp && payload.exp < now) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userMenus");
            setAuthToken(null);
            setLoading(false);
            return;
          }

          // Check if token has required claims (basic tampering detection)
          if (!payload.UserId && !payload.EmpID && !payload.nameid) {
            console.error("Invalid token - missing user identifier");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userMenus");
            setAuthToken(null);
            setLoading(false);
            return;
          }

          // Set authorization header
          setAuthToken(savedToken);
          setToken(savedToken);

          // Determine if admin or employee
          const isAdmin = payload.RoleId && payload.menu;

          if (isAdmin) {
            // Admin user
            setUser({
              empID: payload.UserId,
              email: payload.email,
              name: payload.unique_name || payload.name,
              role: payload.Role || payload.role,
              exp: payload.exp,
            });
            setAuthType("admin");

            // Fetch menus from backend (this will also validate the token)
            try {
              const response = await api.get("/api/auth/menus");
              setUserMenus(response.data);
            } catch (error) {
              // If 401, interceptor will handle logout
              console.error("Failed to fetch menus:", error);
              if (error.response?.status === 401) {
                // Token is invalid - clear everything
                localStorage.removeItem("accessToken");
                localStorage.removeItem("userMenus");
                setAuthToken(null);
                setUser(null);
                setAuthType(null);
                setUserMenus([]);
              }
            }
          } else {
            // Employee user
            setUser({
              empID: payload.EmpID || payload.nameid,
              email: payload.email,
              name: payload.unique_name || payload.name || payload.sub,
              role: payload.Role || payload.role,
              exp: payload.exp,
            });
            setAuthType("employee");
            setUserMenus([]);
          }
        } catch (error) {
          console.error("Token decode error:", error);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userMenus");
          setAuthToken(null);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);
  // Auto-logout when token expires
  useEffect(() => {
    if (!user?.exp) return;

    const now = Date.now() / 1000;
    const timeLeft = user.exp - now;

    if (timeLeft <= 0) {
      SwalError(
        "Session Expired",
        "Your session has expired. Please log in again.",
      );
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

  // Admin/Employee login
  const login = useCallback(async (username, password) => {
    try {
      const resp = await api.post("/api/auth/login", { username, password });
      const token = resp.data.token;

      if (!token) {
        throw new Error("Token missing from response");
      }

      // Store token in localStorage
      localStorage.setItem("accessToken", token);
      setAuthToken(token);
      setToken(token);

      // Decode token to get user info
      const payload = jwtDecode(token);

      // Check if admin (has menus in response) or employee
      if (resp.data.menus && resp.data.menus.length > 0) {
        // Admin login
        const authUser = {
          empID: payload.UserId || payload.nameid,
          email: payload.email,
          name: resp.data.user.name, // Use name from response
          role: resp.data.user.role,
          exp: payload.exp,
        };

        setUser(authUser);
        setUserMenus(resp.data.menus);
        setAuthType("admin");
        return authUser;
      } else {
        // Employee login
        const authUser = {
          empID: payload.EmpID || payload.nameid,
          email: payload.email,
          name: payload.unique_name || payload.name || payload.sub,
          role: payload.Role || payload.role,
          exp: payload.exp,
        };

        setUser(authUser);
        setUserMenus([]);
        setAuthType("employee");
        return authUser;
      }
    } catch (error) {
      console.error("Login error:", error);
      SwalError("Error", error.response?.data || "Login failed");
      throw error;
    }
  }, []);

  // Employee ID verification
  const createToken = useCallback((token) => {
    try {
      localStorage.setItem("accessToken", token);
      setAuthToken(token);
      setToken(token);

      const payload = jwtDecode(token);

      const authUser = {
        empID: payload.EmpID || payload.nameid,
        email: payload.email,
        name: payload.unique_name || payload.name || payload.sub,
        role: payload.Role || payload.role,
        exp: payload.exp,
      };

      setUser(authUser);
      setUserMenus([]);
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
    [user, userMenus, token, loading, authType, login, createToken, logout],
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
