import { Keypair } from '@stellar/stellar-base';
import * as Crypto from 'expo-crypto';
import { AFTER_FIRST_UNLOCK } from 'expo-secure-store';
import { SecureStore, SecureStoreOptions } from '@/utils/secure-store';

const STELLAR_SECRET_KEY = 'tallyx.stellar.secret_key';
const STELLAR_PUBLIC_KEY = 'tallyx.stellar.public_key';

const secureStoreOptions: SecureStoreOptions = {
  keychainAccessible: AFTER_FIRST_UNLOCK,
};

export type StoreWallet = {
  publicKey: string;
  wasCreated: boolean;
};

export async function getOrCreateStoreWallet(): Promise<StoreWallet> {
  const existingSecret = await SecureStore.getItemAsync(STELLAR_SECRET_KEY);

  if (existingSecret) {
    try {
      const existingKeypair = Keypair.fromSecret(existingSecret);
      const publicKey = existingKeypair.publicKey();

      await SecureStore.setItemAsync(STELLAR_PUBLIC_KEY, publicKey, secureStoreOptions);

      return {
        publicKey,
        wasCreated: false,
      };
    } catch {
      await SecureStore.deleteItemAsync(STELLAR_SECRET_KEY);
      await SecureStore.deleteItemAsync(STELLAR_PUBLIC_KEY);
    }
  }

  const keypair = Keypair.fromRawEd25519Seed(Crypto.getRandomBytes(32) as unknown as Buffer);
  const secretKey = keypair.secret();
  const publicKey = keypair.publicKey();

  await SecureStore.setItemAsync(STELLAR_SECRET_KEY, secretKey, secureStoreOptions);
  await SecureStore.setItemAsync(STELLAR_PUBLIC_KEY, publicKey, secureStoreOptions);

  return {
    publicKey,
    wasCreated: true,
  };
}

export async function getStorePublicKey() {
  return SecureStore.getItemAsync(STELLAR_PUBLIC_KEY);
}

export async function clearStoreWalletForDevOnly() {
  await SecureStore.deleteItemAsync(STELLAR_SECRET_KEY);
  await SecureStore.deleteItemAsync(STELLAR_PUBLIC_KEY);
}

