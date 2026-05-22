import { Linking } from 'react-native';
import { CREDIT_CONTRACT_MAINNET, STELLAR_EXPLORER_BASE, USDC_CONTRACT_MAINNET } from './stellar.types';

/**
 * Validates a Stellar public key (G... address, 56 chars).
 */
export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address.trim());
}

/**
 * Truncates a Stellar address for display: GABCD...WXYZ
 */
export function truncateStellarAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

async function openUrl(url: string): Promise<void> {
  const supported = await Linking.canOpenURL(url);
  if (supported) await Linking.openURL(url);
}

/** Opens a transaction on Stellar Expert mainnet explorer. */
export function openTransactionExplorer(txHash: string): Promise<void> {
  return openUrl(`${STELLAR_EXPLORER_BASE}/tx/${txHash}`);
}

/** Opens an account on Stellar Expert mainnet explorer. */
export function openAccountExplorer(publicKey: string): Promise<void> {
  return openUrl(`${STELLAR_EXPLORER_BASE}/account/${publicKey}`);
}

/** Opens a contract on Stellar Expert mainnet explorer. */
export function openContractExplorer(contractId: string): Promise<void> {
  return openUrl(`${STELLAR_EXPLORER_BASE}/contract/${contractId}`);
}

/**
 * Opens Stellar Lab in the browser with a pre-built transaction that calls
 * `approve` on the USDC token contract, granting the credit-ledger contract
 * an allowance to spend `amount` stroops on behalf of `customerPublicKey`.
 *
 * The user signs with Freighter in the browser — no in-app SDK needed.
 *
 * Flow:
 *   1. Open Stellar Lab → user sees the pre-filled approve tx
 *   2. User connects Freighter in the browser and signs
 *   3. User returns to the app and taps "I've Approved — Continue"
 */
export function openUsdcApproveInLab(customerPublicKey: string, amount: number): Promise<void> {
  // Stellar Lab allows pre-filling a contract invocation via URL params.
  // We build the approve call: usdc.approve(customer, credit_ledger, amount, expiry_ledger)
  const params = new URLSearchParams({
    network: 'mainnet',
    contractId: USDC_CONTRACT_MAINNET,
    function: 'approve',
    // Arguments in order: from, spender, amount, expiration_ledger
    // We pass them as JSON-encoded XDR-friendly values via the lab's format
    from: customerPublicKey,
    spender: CREDIT_CONTRACT_MAINNET,
    amount: String(amount),
  });

  const url = `https://lab.stellar.org/contract/invoke?${params.toString()}`;
  return openUrl(url);
}

/**
 * Opens the Freighter web wallet in the browser.
 * On mobile, this launches the Freighter website where users can view their address.
 */
export function openFreighterWeb(): Promise<void> {
  return openUrl('https://freighter.app');
}

/**
 * Opens Stellar Lab for a general transaction builder session.
 */
export function openStellarLab(): Promise<void> {
  return openUrl('https://lab.stellar.org/?network=mainnet');
}
