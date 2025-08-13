// Centralized API base configuration for frontend
// Usage: import { apiFetch, apiUrl, API_BASE } from '@/lib/api'

export const API_BASE = (() => {
  // Prefer explicit env var
  const env = (import.meta as any).env || {};
  const fromEnv = (env.VITE_API_BASE_URL || '').toString().trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  // If hosted under ngrok domain, use same origin
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host.endsWith('.ngrok-free.app')) {
      return `${window.location.protocol}//${host}`.replace(/\/$/, '');
    }
  }

  // Default for local dev
  return 'http://127.0.0.1:5000';
})();

export function apiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export function apiFetch(input: string, init?: RequestInit) {
  return fetch(apiUrl(input), init);
}
