import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoreProfile {
  name: string;
  address?: string;
  phone: string;
  stellarPublicKey?: string;
}

interface StoreState {
  hasStoreProfile: boolean;
  profile: StoreProfile | null;
  setProfile: (profile: StoreProfile) => void;
  clearProfile: () => void;
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set) => ({
      hasStoreProfile: false,
      profile: null,

      setProfile: (profile) => set({ profile, hasStoreProfile: true }),

      clearProfile: () => set({ profile: null, hasStoreProfile: false }),
    }),
    {
      name: 'tallyx-store-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
