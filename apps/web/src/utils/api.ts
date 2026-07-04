const API_BASE = import.meta.env.VITE_API_URL || '';

/** Whether backend features are available (API configured or dev proxy active). */
export const hasBackend = import.meta.env.DEV || API_BASE.length > 0;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Middleware-style fetch wrapper for all backend API calls.
 * - In dev mode: always sends to relative path (Vite proxy handles routing)
 * - In production: returns 503 when no backend is configured
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!hasBackend && !import.meta.env.DEV) {
    return new Response(JSON.stringify({ success: false, error: 'Backend not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return fetch(apiUrl(path), init);
}
