const ENV_API_BASE = import.meta.env.VITE_API_BASE as string | undefined;
const DEFAULT_BASE = import.meta.env.DEV ? "http://localhost:8080/api" : "http://192.168.1.98:8080/api";

export const API_BASE = "http://192.168.1.98:8080/api";

export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
