import {
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  Address,
  BASE_FEE,
  xdr,
  rpc,
} from "@stellar/stellar-sdk";
import { AppError } from "../../middleware/errorHandler.js";

export interface CreateCreditOnChainInput {
  customerId: string;
  creditId: string;
  storeId: string;
  amount: number;
  dueDateUnix?: number;
  // TODO: add customerStellarAddress once customer wallet support is added
  // TODO: add usdcContractId once USDC settlement flow is implemented
}

export interface RecordPaymentOnChainInput {
  onChainCreditId: number;
  amount: number;
}

export interface StellarResult {
  txHash: string;
  onChainCreditId?: number;
}

function getConfig() {
  const secretKey = process.env.STELLAR_SECRET_KEY;
  const contractId = process.env.CREDIT_CONTRACT_ID;
  const rpcUrl = process.env.STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
  const network = process.env.STELLAR_NETWORK ?? "testnet";

  if (!secretKey) throw new AppError("STELLAR_SECRET_KEY is not configured", 500);
  if (!contractId) throw new AppError("CREDIT_CONTRACT_ID is not configured", 500);

  const networkPassphrase =
    network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

  return { secretKey, contractId, rpcUrl, networkPassphrase };
}

async function submitContractCall(
  method: string,
  args: xdr.ScVal[],
): Promise<{ txHash: string; returnValue: xdr.ScVal }> {
  const { secretKey, contractId, rpcUrl, networkPassphrase } = getConfig();

  const keypair = Keypair.fromSecret(secretKey);
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(contractId);

  const account = await server.getAccount(keypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new AppError(`Soroban simulation failed: ${simResult.error}`, 500);
  }

  const preparedTx = rpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(keypair);

  const sendResult = await server.sendTransaction(preparedTx);
  if (sendResult.status === "ERROR") {
    throw new AppError(`Soroban submission failed: ${JSON.stringify(sendResult.errorResult)}`, 500);
  }

  const txHash = sendResult.hash;

  // Poll for confirmation (up to ~15s)
  let getResult = await server.getTransaction(txHash);
  for (let i = 0; i < 15 && getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await server.getTransaction(txHash);
  }

  if (getResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new AppError(`Soroban transaction failed with status: ${getResult.status}`, 500);
  }

  const returnValue = getResult.returnValue ?? xdr.ScVal.scvVoid();
  return { txHash, returnValue };
}

/**
 * Calls the Soroban credit-ledger contract's `create_credit` function.
 * Records the credit as a verification entry on-chain (ledger-only, no token transfer).
 * Returns the transaction hash and the on-chain credit ID assigned by the contract.
 */
export async function createCreditOnChain(
  input: CreateCreditOnChainInput,
): Promise<StellarResult> {
  const { secretKey } = getConfig();
  const keypair = Keypair.fromSecret(secretKey);
  const storeOwnerAddress = new Address(keypair.publicKey());

  const dueDateUnix = input.dueDateUnix ?? 0;

  const args: xdr.ScVal[] = [
    storeOwnerAddress.toScVal(),
    nativeToScVal(input.storeId, { type: "string" }),
    nativeToScVal(input.customerId, { type: "string" }),
    nativeToScVal(BigInt(input.amount), { type: "i128" }),
    nativeToScVal(BigInt(dueDateUnix), { type: "u64" }),
  ];

  const { txHash, returnValue } = await submitContractCall("create_credit", args);

  // Contract returns the new credit_id as u64
  const onChainCreditId = Number(returnValue.u64());

  return { txHash, onChainCreditId };
}

/**
 * Calls the Soroban credit-ledger contract's `record_payment` function.
 * Records the payment as a proof on-chain (ledger-only, no USDC transfer).
 * `onChainCreditId` is the u64 ID returned by `create_credit` at issuance time.
 *
 * TODO: add USDC transfer_from once customer wallet approval flow exists
 */
export async function recordPaymentOnChain(
  input: RecordPaymentOnChainInput,
): Promise<StellarResult> {
  const args: xdr.ScVal[] = [
    nativeToScVal(BigInt(input.onChainCreditId), { type: "u64" }),
    nativeToScVal(BigInt(input.amount), { type: "i128" }),
  ];

  const { txHash } = await submitContractCall("record_payment", args);
  return { txHash };
}
