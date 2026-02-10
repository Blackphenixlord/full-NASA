// Vite exposes env variables via import.meta.env, but TypeScript may not recognize 'env' on ImportMeta by default.
// Add a type declaration for ImportMetaEnv if needed.
// Add ImportMetaEnv type declaration for Vite env compatibility
interface ImportMetaEnv {
  VITE_API_BASE?: string;
  DEV?: boolean;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

const ENV_API_BASE = import.meta.env.VITE_API_BASE as string | undefined;
const DEFAULT_BASE = import.meta.env.DEV
  ? "http://192.163.1.98:8080/api"
  : "/api";

export const API_BASE = (ENV_API_BASE && ENV_API_BASE.trim())
  ? ENV_API_BASE.trim().replace(/\/$/, "")
  : DEFAULT_BASE;

export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
