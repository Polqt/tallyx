// Stellar / Soroban integration service
// All functions are placeholders until the Soroban contract is deployed.

export interface CreateCreditOnChainInput {
  customerId: string;
  creditId: string;
  amount: number;
}

export interface RecordPaymentOnChainInput {
  creditId: string;
  amount: number;
}

export interface StellarResult {
  txHash: string;
}

/**
 * Calls the Soroban credit-ledger contract's `create_entry` function.
 *
 * TODO: Replace mock with actual Soroban contract call:
 *   1. Build a Stellar transaction invoking the contract
 *   2. Sign with the store's keypair (from env)
 *   3. Submit via RPC (STELLAR_RPC_URL)
 *   4. Return the real transaction hash
 */
export async function createCreditOnChain(
  input: CreateCreditOnChainInput
): Promise<StellarResult> {
  console.log("[Stellar] create_entry (mock)", input);

  // TODO: import { SorobanRpc, Contract, TransactionBuilder } from "@stellar/stellar-sdk"
  // TODO: const contract = new Contract(process.env.CREDIT_CONTRACT_ID!)
  // TODO: call contract.call("create_entry", debtor, creditor, amount)

  return { txHash: `mock_create_${Date.now()}` };
}

/**
 * Calls the Soroban credit-ledger contract's `record_payment` function.
 *
 * TODO: Replace mock with actual Soroban contract call:
 *   1. Build a Stellar transaction invoking the contract
 *   2. Sign with the store's keypair (from env)
 *   3. Submit via RPC (STELLAR_RPC_URL)
 *   4. Return the real transaction hash
 */
export async function recordPaymentOnChain(
  input: RecordPaymentOnChainInput
): Promise<StellarResult> {
  console.log("[Stellar] record_payment (mock)", input);

  // TODO: import { SorobanRpc, Contract, TransactionBuilder } from "@stellar/stellar-sdk"
  // TODO: const contract = new Contract(process.env.CREDIT_CONTRACT_ID!)
  // TODO: call contract.call("record_payment", debtor, amount, memo)

  return { txHash: `mock_payment_${Date.now()}` };
}
