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
  return 'https://0f9cb563b4c3.ngrok-free.app';
})();

export function apiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export function apiFetch(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers as HeadersInit);
  // Prevent ngrok browser warning page (which is HTML) from being returned
  headers.set('ngrok-skip-browser-warning', 'true');
  // Prefer JSON responses
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  return fetch(apiUrl(input), { ...init, headers });
}

export async function apiJson<T = any>(input: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(input, init);
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(`Invalid JSON from ${apiUrl(input)} (content-type=${contentType}): ${text.slice(0, 200)}`);
  }
}
