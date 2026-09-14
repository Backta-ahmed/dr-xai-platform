import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE, ROUTES } from "../constants";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  // Without this a hung request leaves the UI spinning forever. Generous
  // because running a diagnosis is the slowest call in the app.
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // A failed login is a 401 too, but the login page shows its own message —
    // redirecting from there would wipe the form and hide the reason.
    const isLoginAttempt = error.config?.url?.includes("/auth/login");

    if (status === 401 && !isLoginAttempt) {
      localStorage.removeItem("access_token");
      toast.error("Your session expired. Please sign in again.");
      setTimeout(() => {
        window.location.href = ROUTES.LOGIN;
      }, 600);
    }
    return Promise.reject(error);
  }
);

/**
 * Pull a human-readable message out of an axios error.
 *
 * FastAPI returns `detail` as a string for raised HTTPExceptions but as an
 * array of objects for 422 validation errors. Rendering that array directly
 * puts "[object Object]" in front of the user.
 */
export function errorMessage(error, fallback = "Something went wrong.") {
  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }
  if (error?.response === undefined) {
    return "Cannot reach the server. Check that the backend is running.";
  }

  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    const field = Array.isArray(first?.loc) ? first.loc[first.loc.length - 1] : null;
    return field ? `${field}: ${first.msg}` : first.msg || fallback;
  }
  return fallback;
}

export default api;
