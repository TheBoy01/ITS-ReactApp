import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:5001/api', // backend URL
  withCredentials: true // important so cookies are sent/received
});

let accessToken = null; // in-memory

export const setAccessToken = (token) => { accessToken = token; };
export const clearAccessToken = () => { accessToken = null; };

api.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// response interceptor handles 401 -> try refresh once
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
}
function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(response => response, async error => {
  const originalRequest = error.config;
  if (error.response && error.response.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
      // queue request
      return new Promise((resolve) => {
        addRefreshSubscriber((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axios(originalRequest));
        });
      });
    }
    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const resp = await axios.post('https://localhost:5001/api/auth/refresh', {}, { withCredentials: true });
      const { accessToken } = resp.data;
      setAccessToken(accessToken);
      onRefreshed(accessToken);
      refreshSubscribers = [];
      isRefreshing = false;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axios(originalRequest);
    } catch (e) {
      isRefreshing = false;
      // cannot refresh, redirect to login or surface error
      window.location.href = '/login';
      return Promise.reject(e);
    }
  }
  return Promise.reject(error);
});

export default api;
