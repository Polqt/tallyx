import { Platform } from 'react-native';
import * as ExpoSecureStore from 'expo-secure-store';
export type { SecureStoreOptions } from 'expo-secure-store';

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
