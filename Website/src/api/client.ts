import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 10000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lmc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
      }
    }
    return Promise.reject(error);
  }
);
