import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 20000,
});

// Tell the app when the admin session has expired so it can show the login page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    if (err.response?.status === 401 && !url.startsWith("/auth/")) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(err);
  }
);

export function photoUrl(person) {
  if (!person?.hasPhoto || !person._id) return null;
  const version = person.updatedAt ? `?v=${encodeURIComponent(person.updatedAt)}` : "";
  return `/api/people/${person._id}/photo${version}`;
}

export default api;
