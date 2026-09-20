// Centralized API configuration for NEXUS AI Agent Orchestrator
// Production must NEVER use or display http://localhost:8000.

const envUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
  '';

// Detect if running in a local developer environment
const isLocalEnv = Boolean(
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
);

// Optional runtime override via URL query parameter or sessionStorage for emergency judge testing
function getRuntimeOverride() {
  if (typeof window === 'undefined') return '';
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const queryApi = urlParams.get('apiUrl') || urlParams.get('api');
    if (queryApi) {
      window.sessionStorage.setItem('NEXUS_API_OVERRIDE', queryApi);
      return queryApi;
    }
    return window.sessionStorage.getItem('NEXUS_API_OVERRIDE') || '';
  } catch {
    return '';
  }
}

function resolveApiBase() {
  const runtimeOverride = getRuntimeOverride();
  if (runtimeOverride) {
    return runtimeOverride.trim().replace(/\/+$/, '');
  }

  const trimmedEnv = envUrl.trim().replace(/\/+$/, '');
  if (trimmedEnv) {
    // In production, reject localhost values to prevent accidental loopback binding
    const isEnvLocal = /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(trimmedEnv);
    if (!isLocalEnv && isEnvLocal) {
      console.warn('[NEXUS] Production build detected local API URL. Ignoring localhost in production.');
      return '';
    }
    return trimmedEnv;
  }

  // Local development fallback only
  if (isLocalEnv) {
    return 'http://localhost:8000';
  }

  // Production with no VITE_API_URL configured: never default to localhost
  return '';
}

export const API_BASE = resolveApiBase();
export const IS_LOCAL_ENV = isLocalEnv;
export const IS_API_CONFIGURED = Boolean(API_BASE);

/**
 * Returns a normalized absolute API URL for the requested path.
 * @param {string} path - Route path (e.g. '/goals', '/health')
 * @returns {string} Fully qualified URL or path
 */
export function getApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE) return cleanPath;
  return `${API_BASE}${cleanPath}`;
}

/**
 * Indicates if the currently configured API URL points to localhost/loopback.
 */
export function isLocalApiUrl() {
  if (!API_BASE) return false;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(API_BASE);
}
