import axios from 'axios';

/**
 * Backend API standard configuration
 * - withCredentials: true is essential for CORS environments where the backend 
 *   requires credentials (cookies, auth headers) as per setAllowCredentials(true).
 */
const api = axios.create({
  baseURL: '', // Vite 프록시를 사용하기 위해 비워둠
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling (optional but recommended)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;
