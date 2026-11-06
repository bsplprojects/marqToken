import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

// an admin "view as member" session lives only in this browser tab
export const viewToken = () => sessionStorage.getItem("merqon_view_jwt");

api.interceptors.request.use((config) => {
  const token = viewToken() || localStorage.getItem("merqon_jwt");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      if (viewToken()) sessionStorage.removeItem("merqon_view_jwt");
      else localStorage.removeItem("merqon_jwt");
      if (!window.location.pathname.endsWith("/")) {
        window.location.href = "/";
      }
    }
    return Promise.reject(err);
  }
);
