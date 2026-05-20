const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Registered by AuthProvider on mount. Called when any API request gets a 401.
let _onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

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
