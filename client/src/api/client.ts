import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh once, and never on the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(`${BASE}/api/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch {
        // Refresh failed — go to login, do NOT retry
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // For any other 401 (including on /refresh itself), just reject
    return Promise.reject(error);
  }
);

export default api;
