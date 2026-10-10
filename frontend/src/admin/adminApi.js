import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const ADMIN_API = `${BACKEND_URL}/api/admin`;
export const AUTH_API = `${BACKEND_URL}/api`;

export const adminApi = axios.create({ baseURL: ADMIN_API });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("merqon_admin_jwt");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("merqon_admin_jwt");
      window.location.href = "/admin";
    }
    return Promise.reject(err);
  }
);
