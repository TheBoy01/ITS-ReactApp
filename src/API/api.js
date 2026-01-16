import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "https://localhost:7100";

//"https://aus-itsystem-dcecfahra7dxe6gj.polandcentral-01.azurewebsites.net";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress 401 errors for /api/auth/me endpoint (expected when not logged in)
    if (
      error.config?.url?.includes("/api/auth/me") &&
      error.response?.status === 401
    ) {
      return Promise.reject(error); // Reject silently without logging
    }

    // Log other errors normally
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
