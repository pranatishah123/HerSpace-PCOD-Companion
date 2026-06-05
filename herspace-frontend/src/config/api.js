export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export function apiUrl(path = "") {
  const normalizedPath = String(path).replace(/^\/+/, "");
  return normalizedPath ? `${API_BASE_URL}/${normalizedPath}` : API_BASE_URL;
}
