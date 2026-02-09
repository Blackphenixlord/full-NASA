const ENV_API_BASE = import.meta.env.VITE_API_BASE as string | undefined;
const DEFAULT_BASE = import.meta.env.DEV ? "http://localhost:8080/api" : "/api";

export const API_BASE = (ENV_API_BASE && ENV_API_BASE.trim())
  ? ENV_API_BASE.trim().replace(/\/$/, "")
  : DEFAULT_BASE;

export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
