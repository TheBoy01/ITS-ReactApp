import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://aus-itsystem-dcecfahra7dxe6gj.polandcentral-01.azurewebsites.net"; //"https://localhost:7100";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
