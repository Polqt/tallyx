import { create } from 'zustand';

interface AccountSetupState {
  storeName: string;
  phoneNumber: string;
  setStoreName: (name: string) => void;
  setPhoneNumber: (phone: string) => void;
  reset: () => void;
}

export const useAccountSetupStore = create<AccountSetupState>()((set) => ({
  storeName: '',
  phoneNumber: '',
  setStoreName: (name) => set({ storeName: name }),
  setPhoneNumber: (phone) => set({ phoneNumber: phone }),
  reset: () => set({ storeName: '', phoneNumber: '' }),
}));
