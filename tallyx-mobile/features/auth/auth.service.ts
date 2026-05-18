import * as SecureStore from 'expo-secure-store';
import type { AuthSession, AuthUser, StoreProfileResponse } from './auth.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

type ApiOptions = RequestInit & {
  token?: string;
};

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const data = await readJson(response);

  if (!response.ok) {
    const message =
      typeof data.error === 'string'
        ? data.error
        : typeof data.message === 'string'
          ? data.message
          : 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

export function getStoredAuthToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function saveAuthToken(token: string) {
  return SecureStore.setItemAsync(TOKEN_KEY, token, secureStoreOptions);
}

export function clearAuthToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function signInWithEmail(email: string, password: string) {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function signUpWithEmail(ownerName: string, email: string, password: string) {
  return request<AuthSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ownerName, email, password }),
  });
}

export function getCurrentUser(token: string) {
  return request<{ user: AuthUser }>('/auth/me', { token });
}

export function getMyStore(token: string) {
  return request<StoreProfileResponse>('/stores/me', { token });
}

export function createStoreProfile(
  token: string,
  input: {
    storeName: string;
    phoneNumber?: string;
    stellarPublicKey: string;
  }
) {
  return request<StoreProfileResponse>('/stores', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}
