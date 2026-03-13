import axios from 'axios';

/**
 * Backend API standard configuration for Unified Hosting (Nginx + Cloudflare)
 * - baseURL: Empty string ('') is crucial. It forces the browser to use the 
 *   current origin (e.g., https://xxx.trycloudflare.com), allowing Nginx 
 *   to intercept and proxy the request to the backend without CORS issues.
 */
const api = axios.create({
  baseURL: '', 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;
