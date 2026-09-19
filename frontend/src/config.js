// Centralized API configuration for NEXUS AI Agent Orchestrator
// Reads VITE_API_URL (recommended) or VITE_API_BASE_URL.
// Defaults to local FastAPI development server at http://localhost:8000.

const rawUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000';

export const API_BASE = rawUrl.replace(/\/+$/, '');

/**
 * Returns a normalized absolute API URL for the requested path.
 * @param {string} path - Route path (e.g. '/goals', '/health')
 * @returns {string} Fully qualified URL
 */
export function getApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

/**
 * Indicates if the currently configured API URL points to localhost/loopback.
 * Helpful for diagnosing remote/production access limitations.
 */
export function isLocalApiUrl() {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(API_BASE);
}
