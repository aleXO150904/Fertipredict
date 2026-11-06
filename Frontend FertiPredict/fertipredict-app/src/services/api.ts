import axios from "axios";

// URL base del backend Spring Boot. Usamos una variable de entorno para Docker, con fallback local.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: agrega automáticamente el token JWT a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Confirm the session independently: an upstream/internal 401 must not erase it.
const checks = new Map<string, Promise<boolean>>();
function sessionIsInvalid(token: string): Promise<boolean> {
  const pending = checks.get(token);
  if (pending) return pending;
  const check = axios.get(`${API_BASE_URL.replace(/\/$/, "")}/api/v1/user/me`, {
    headers: { Authorization: `Bearer ${token}` }, timeout: 15000,
  }).then(() => false).catch(error => axios.isAxiosError(error) && error.response?.status === 401)
    .finally(() => checks.delete(token));
  checks.set(token, check);
  return check;
}
api.interceptors.response.use(response => response, async error => {
  const token = localStorage.getItem("token");
  const authorization = error.config?.headers?.Authorization;
  if (error.response?.status === 401 && !error.config?.url?.startsWith("/auth/")
      && token && authorization === `Bearer ${token}`) {
    const invalid = await sessionIsInvalid(token);
    if (invalid && localStorage.getItem("token") === token) {
      window.dispatchEvent(new Event("fertipredict:unauthorized"));
    }
  }
  // Never retry a mutation automatically: it may already have reached the server.
  return Promise.reject(error);
});