export interface StellarWallet {
  publicKey: string;
  network: 'testnet' | 'mainnet';
}

export const STELLAR_EXPLORER_BASE = 'https://stellar.expert/explorer/mainnet';

// Mainnet USDC contract (Circle)
export const USDC_CONTRACT_MAINNET = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';

// Tallyx credit-ledger contract on mainnet
export const CREDIT_CONTRACT_MAINNET = 'PENDING_MAINNET_DEPLOY';
