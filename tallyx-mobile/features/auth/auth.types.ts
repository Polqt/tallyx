export interface AuthUser {
  id: string;
  ownerName: string;
  email: string;
  hasStore: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface StoreProfileResponse {
  store: {
    storeName?: string;
    name?: string;
    phoneNumber?: string | null;
    phone?: string | null;
    stellarPublicKey?: string | null;
  };
}
