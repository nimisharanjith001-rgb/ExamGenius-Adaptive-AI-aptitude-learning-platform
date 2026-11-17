import axios from 'axios';
import { handleMockFallback } from './mockFallback';

const getBaseUrl = () => {
  if ((import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }
  // In the browser, relative '/api' leverages Vite's proxy automatically
  // across all devices on the network (Windows PC, Mac, Mobile, LAN IP)
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://127.0.0.1:8000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject Authorization token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('powerpulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor with intelligent fallback for static/Vercel/offline deployments
api.interceptors.response.use(
  (response) => {
    // If hosting platform (e.g. Vercel) rewrote an /api request to /index.html with status 200 OK
    const isHtmlResponse =
      typeof response.data === 'string' &&
      (response.data.includes('<!DOCTYPE html>') ||
       response.data.includes('<!doctype html>') ||
       response.data.includes('<html') ||
       (response.headers && String(response.headers['content-type'] || '').includes('text/html')));

    if (isHtmlResponse) {
      const config = response.config;
      if (config && config.url) {
        try {
          const reqData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
          const fallbackRes = handleMockFallback(config.url, config.method || 'GET', reqData);
          return fallbackRes as any;
        } catch {
          const fallbackRes = handleMockFallback(config.url, config.method || 'GET', config.data);
          return fallbackRes as any;
        }
      }
    }
    return response;
  },
  async (error) => {
    // If the server answered with an intentional validation/auth error, pass it directly
    if (error.response && [400, 401, 403].includes(error.response.status) && error.response.data?.detail) {
      if (error.response.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('powerpulse_token');
        localStorage.removeItem('powerpulse_user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // If backend is unreachable or host has no API route (e.g., Vercel static deployment)
    if (!error.response || [404, 405, 500, 502, 503, 504].includes(error.response.status)) {
      const config = error.config;
      if (config && config.url) {
        try {
          const reqData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
          const fallbackRes = handleMockFallback(config.url, config.method || 'GET', reqData);
          return fallbackRes;
        } catch {
          try {
            const fallbackRes = handleMockFallback(config.url, config.method || 'GET', config.data);
            return fallbackRes;
          } catch (err) {
            return Promise.reject(err);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

