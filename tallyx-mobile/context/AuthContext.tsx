import { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useStoreStore } from '@/stores/store.store';
import type { AuthUser, StoreProfileResponse } from '@/features/auth/auth.types';
import {
  clearAuthToken,
  createStoreProfile,
  getCurrentUser,
  getMyStore,
  getStoredAuthToken,
  saveAuthToken,
  signInWithEmail,
  signUpWithEmail,
} from '@/features/auth/auth.service';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (ownerName: string, email: string, password: string) => Promise<void>;
  setupStore: (storeName: string, phoneNumber: string, stellarPublicKey: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function cacheStoreProfile(data: StoreProfileResponse) {
    const store = data.store;

    useStoreStore.getState().setProfile({
      name: store.storeName ?? store.name ?? 'My Store',
      phone: store.phoneNumber ?? store.phone ?? '',
      stellarPublicKey: store.stellarPublicKey ?? undefined,
    });
  }

  async function fetchStoreProfile(authToken: string) {
    try {
      const data = await getMyStore(authToken);
      cacheStoreProfile(data);
    } catch {
      // Non-fatal: the dashboard can render while store sync catches up.
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await getStoredAuthToken();
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        const data = await getCurrentUser(storedToken);
        setToken(storedToken);
        setUser(data.user);

        if (data.user.hasStore) {
          await fetchStoreProfile(storedToken);
        }
      } catch {
        await clearAuthToken();
        useStoreStore.getState().clearProfile();
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(email: string, password: string) {
    const data = await signInWithEmail(email, password);
    await saveAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);

    if (data.user.hasStore) {
      await fetchStoreProfile(data.token);
    }

    router.replace(data.user.hasStore ? '/(protected)/(tabs)/dashboard' : '/(account)');
  }

  async function signUp(ownerName: string, email: string, password: string) {
    const data = await signUpWithEmail(ownerName, email, password);
    await saveAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    router.replace(data.user.hasStore ? '/(protected)/(tabs)/dashboard' : '/(account)');
  }

  async function setupStore(storeName: string, phoneNumber: string, stellarPublicKey: string) {
    if (!token) {
      throw new Error('Missing auth session. Please sign in again.');
    }

    const data = await createStoreProfile(token, {
      storeName,
      phoneNumber: phoneNumber || undefined,
      stellarPublicKey,
    });

    cacheStoreProfile(data);
    setUser((prev) => prev ? { ...prev, hasStore: true } : prev);
    router.replace('/(protected)/(tabs)/dashboard');
  }

  async function signOut() {
    await clearAuthToken();
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
