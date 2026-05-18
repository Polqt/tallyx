import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'store_owner' | 'customer' | null;

interface OnboardingState {
  hasSeenOnboarding: boolean;
  hasHydrated: boolean;
  selectedRole: UserRole;
  setHasSeenOnboarding: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  setSelectedRole: (role: UserRole) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      hasHydrated: false,
      selectedRole: null,
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSelectedRole: (role) => set({ selectedRole: role }),
    }),
    {
      name: 'tallyx-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
