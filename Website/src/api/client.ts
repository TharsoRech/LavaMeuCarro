import axios from 'axios';

// API URL - use env var or default to VPS IP (direct, not through nginx proxy)
const API_URL = import.meta.env.VITE_API_URL || 'http://187.127.26.164:5050';

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 15000 });

export const masterApi = axios.create({ baseURL: `${API_URL}/api`, timeout: 15000 });

// Admin token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lmc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Master token interceptor
masterApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('lmc_master_token') || localStorage.getItem('lmc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Admin response interceptor with refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('lmc_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          localStorage.setItem('lmc_token', data.token);
          localStorage.setItem('lmc_refresh_token', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/admin/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Master response interceptor with refresh
masterApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('lmc_master_refresh_token') || localStorage.getItem('lmc_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          localStorage.setItem('lmc_master_token', data.token);
          localStorage.setItem('lmc_master_refresh_token', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return masterApi(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/master/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/master/login';
      }
    }
    return Promise.reject(error);
  }
);
