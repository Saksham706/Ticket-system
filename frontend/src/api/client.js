import axios from "axios";
import { toast } from "react-toastify";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 20000
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let pending = [];

function settlePending(error, token = null) {
  pending.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  pending = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = /\/auth\/(login|register|verify|forgot|reset|refresh|logout)/.test(original?.url || "");

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          pending.push({
            resolve: (token) => {
              if (token) original.headers.Authorization = `Bearer ${token}`;
              resolve(client(original));
            },
            reject
          });
        });
      }

      original._retry = true;
      refreshing = true;
      try {
        const response = await axios.post(
          `${client.defaults.baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true, timeout: 15000 }
        );
        const token = response.data?.data?.accessToken || response.data?.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
          original.headers.Authorization = `Bearer ${token}`;
        }
        settlePending(null, token);
        return client(original);
      } catch (refreshError) {
        settlePending(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        refreshing = false;
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === "ECONNABORTED" ? "Request timed out. Try again." : "") ||
      (!error.response ? "Cannot connect to the server. Check that the backend is running." : "Something went wrong.");
    if (!original?.silentError) toast.error(message);
    return Promise.reject(error);
  }
);

export function payload(response) {
  const body = response?.data;
  // API responses in this project use { statusCode, message, data }.
  if (body && Object.prototype.hasOwnProperty.call(body, "data")) return body.data;
  return body;
}

export default client;
