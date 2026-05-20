export interface StellarWallet {
  publicKey: string;
  network: 'testnet' | 'mainnet';
}

export const STELLAR_EXPLORER_BASE = 'https://stellar.expert/explorer/testnet';

// Testnet USDC contract (Circle) — used for approve flow
export const USDC_CONTRACT_TESTNET = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';

// Tallyx credit-ledger contract on testnet
export const CREDIT_CONTRACT_TESTNET = 'CCHRJVFEVSJEQPEEL4655WLIF7DQRI7ZYNUOTPJTYPRCYNNHE2JAJYNN';
