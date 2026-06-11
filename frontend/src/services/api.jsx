import axios from "axios";

// no base url = same origin. dev server + nginx both proxy /api to the backend,
// which keeps the auth cookies first-party. only set this for a separate API host.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT, 10) || 30000;

const API_PREFIX = "/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // send the auth cookies
  // axios reads this cookie and sends it back as a header (CSRF)
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    "Content-Type": "application/json",
  },
});

// share one refresh call if several requests 401 at the same time
let refreshPromise = null;

const isAuthPath = (url = "") =>
  url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/signup");

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !isAuthPath(original.url)) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || api.post(`${API_PREFIX}/auth/refresh`);
        await refreshPromise;
        return api(original);
      } catch (refreshError) {
        // refresh failed -> session is dead, let the app log out and redirect
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  },
);

// escape user input on the way out too (backend already escapes, but doesn't hurt)
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .trim();
};

// Auth endpoints
export const login = (username, password) =>
  api.post(`${API_PREFIX}/auth/login`, { username, password });
export const register = (username, password) =>
  api.post(`${API_PREFIX}/auth/signup`, { username, password, role: "USER" });
export const refreshSession = () => api.post(`${API_PREFIX}/auth/refresh`);
export const logout = () => api.post(`${API_PREFIX}/auth/logout`);

// Task endpoints
export const getTasks = (params) => {
  const sanitizedParams = { ...params };
  if (sanitizedParams.keyword) {
    sanitizedParams.keyword = sanitizeInput(sanitizedParams.keyword);
  }
  return api.get(`${API_PREFIX}/tasks`, { params: sanitizedParams });
};

export const getTaskStatistics = () => api.get(`${API_PREFIX}/tasks/statistics`);
export const getTaskById = (id) => api.get(`${API_PREFIX}/tasks/${id}`);
export const createTask = (task) => {
  const sanitizedTask = {
    ...task,
    title: sanitizeInput(task.title),
    description: task.description ? sanitizeInput(task.description) : null,
  };
  return api.post(`${API_PREFIX}/tasks`, sanitizedTask);
};
export const updateTask = (id, task) => {
  const sanitizedTask = {
    ...task,
    title: sanitizeInput(task.title),
    description: task.description ? sanitizeInput(task.description) : null,
  };
  return api.put(`${API_PREFIX}/tasks/${id}`, sanitizedTask);
};
export const deleteTask = (id) => api.delete(`${API_PREFIX}/tasks/${id}`);

export default api;
