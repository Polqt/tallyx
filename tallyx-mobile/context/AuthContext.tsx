import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useStoreStore } from '@/stores/store.store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

interface User {
  id: string;
  ownerName: string;
  email: string;
  hasStore: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (ownerName: string, email: string, password: string) => Promise<void>;
  setupStore: (storeName: string, phoneNumber: string, stellarPublicKey: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchStoreProfile(authToken: string) {
    try {
      const res = await fetch(`${API_URL}/stores/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const store = data.store ?? data;
        useStoreStore.getState().setProfile({
          name: store.storeName ?? store.name,
          phone: store.phoneNumber ?? store.phone ?? '',
          stellarPublicKey: store.stellarPublicKey,
        });
      }
    } catch {
      // non-fatal — dashboard falls back to user.ownerName
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!stored) { setIsLoading(false); return; }

        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });

        if (res.ok) {
          const data = await res.json();
          setToken(stored);
          setUser(data.user);
          if (data.user.hasStore) {
            await fetchStoreProfile(stored);
          }
        } else {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, []);

  async function signIn(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.message ?? 'Sign in failed');

    await SecureStore.setItemAsync(TOKEN_KEY, data.token, secureStoreOptions);
    setToken(data.token);
    setUser(data.user);
    if (data.user.hasStore) {
      await fetchStoreProfile(data.token);
    }
    router.replace(data.user.hasStore ? '/(protected)/(tabs)/dashboard' : '/(account)' as any);
  }

  async function signUp(ownerName: string, email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerName, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.message ?? 'Sign up failed');

    router.replace('/(auth)/sign-in');
  }

  async function setupStore(storeName: string, phoneNumber: string, stellarPublicKey: string) {
    if (!token) {
      throw new Error('Missing auth session. Please sign in again.');
    }

    const res = await fetch(`${API_URL}/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        storeName,
        phoneNumber: phoneNumber || undefined,
        stellarPublicKey,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.message ?? 'Store setup failed');

    useStoreStore.getState().setProfile({
      name: data.store?.storeName ?? storeName,
      phone: data.store?.phoneNumber ?? phoneNumber,
      stellarPublicKey: data.store?.stellarPublicKey ?? stellarPublicKey,
    });
    setUser((prev) => prev ? { ...prev, hasStore: true } : prev);
    router.replace('/(protected)/(tabs)/dashboard');
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    useStoreStore.getState().clearProfile();
    setToken(null);
    setUser(null);
    router.replace('/(auth)/sign-in');
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signUp, setupStore, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
