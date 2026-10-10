import axios from 'axios';

// In production (Netlify) set VITE_API_BASE_URL to your hosted backend,
// e.g. https://learnpath-api.onrender.com/api  (must be https://).
// In local development it falls back to the Spring Boot default port.
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8080/api' : '/api');

const api = axios.create({
  baseURL,
  timeout: 30000 // free-tier backends can take a while to wake up
});

export function errorMessage(error) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Something went wrong.';
}

export default api;
