import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidStellarAddress } from './stellar.service';
import type { StellarWallet } from './stellar.types';

interface StellarState {
  wallet: StellarWallet | null;
  connect: (publicKey: string) => void;
  disconnect: () => void;
}

export const useStellarStore = create<StellarState>()(
  persist(
    (set) => ({
      wallet: null,
      connect: (publicKey) => {
        if (!isValidStellarAddress(publicKey)) return;
        set({ wallet: { publicKey, network: 'mainnet' } });
      },
      disconnect: () => set({ wallet: null }),
    }),
    {
      name: 'tallyx-stellar-wallet',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
