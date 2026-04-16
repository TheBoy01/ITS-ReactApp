import axios from "axios";

//const API_BASE = window.location.origin;
const API_BASE = import.meta.env.VITE_API_BASE || "https://localhost:7100";
//"https://neon-operational-challenge-norfolk.trycloudflare.com"
//const API_BASE = "http://10.0.0.18:5001";
// 
//"https://neon-operational-challenge-norfolk.trycloudflare.com"
//"https://aus-itsystem-dcecfahra7dxe6gj.polandcentral-01.azurewebsites.net";

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Response interceptor to handle 401 errors

export default api;
