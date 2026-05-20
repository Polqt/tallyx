import { Platform } from 'react-native';
import * as ExpoSecureStore from 'expo-secure-store';
export type { SecureStoreOptions } from 'expo-secure-store';

// Web fallback uses localStorage because expo-secure-store has no web implementation.
// This is intentional: Tallyx targets iOS/Android only. The web path exists solely
// for local development convenience (Expo Go web preview) and is never shipped to users.
// Do not use this app in a browser in production — tokens are not XSS-protected there.
export const SecureStore = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return ExpoSecureStore.getItemAsync(key);
  },

  async setItemAsync(
    key: string,
    value: string,
    options?: ExpoSecureStore.SecureStoreOptions
  ): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    return ExpoSecureStore.setItemAsync(key, value, options);
  },

  async deleteItemAsync(
    key: string,
    options?: ExpoSecureStore.SecureStoreOptions
  ): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    return ExpoSecureStore.deleteItemAsync(key, options);
  },
};
