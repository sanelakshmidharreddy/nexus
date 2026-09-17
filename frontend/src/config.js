// Centralized API configuration for Nexus AI Agent Orchestrator
// Reads VITE_API_BASE_URL if set (e.g. deployed on Vercel connecting to a backend server),
// otherwise falls back to local FastAPI development server at http://localhost:8000.

const rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_BASE = rawUrl.replace(/\/+$/, '');

export function getApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
