import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

// No retry interceptor - if a request fails with 401, just let it fail.
// The ProtectedRoute and AuthContext handle redirecting to login.
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
