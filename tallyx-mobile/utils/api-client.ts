const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Registered by AuthProvider on mount. Called when any API request gets a 401.
let _onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

const REQUEST_TIMEOUT_MS = 15_000;

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned non-JSON response (status ${response.status})`);
  }
}

export async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401) {
    _onUnauthorized?.();
    throw new Error('Session expired. Please sign in again.');
  }

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? `Request failed with status ${response.status}`);
  }

  return data as T;
}
