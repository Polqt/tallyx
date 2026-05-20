import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { payments, credits, customers, stores } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import { recordPaymentOnChain } from "../stellar/stellar.service.js";
import type { RecordPaymentInput } from "./payments.schema.js";

async function getStoreIdForUser(userId: string) {
  const [store] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.userId, userId))
    .limit(1);

  if (!store) throw new AppError("Store not found", 404);
  return store.id;
}

export async function getPaymentsByCreditId(creditId: string) {
  return db.select().from(payments).where(eq(payments.creditId, creditId));
}

export async function getPaymentForUser(userId: string, paymentId: string) {
  const storeId = await getStoreIdForUser(userId);

  const [row] = await db
    .select({
      id: payments.id,
      creditId: payments.creditId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      stellarTxHash: payments.stellarTxHash,
      createdAt: payments.createdAt,
      credit: {
        id: credits.id,
        amount: credits.amount,
        balance: credits.balance,
        status: credits.status,
      },
      customer: {
        id: customers.id,
        name: customers.name,
      },
    })
    .from(payments)
    .innerJoin(credits, eq(payments.creditId, credits.id))
    .innerJoin(customers, eq(credits.customerId, customers.id))
    .where(and(eq(payments.id, paymentId), eq(credits.storeId, storeId)))
    .limit(1);

  if (!row) throw new AppError("Payment not found", 404);
  return row;
}

export async function getPaymentsForUser(userId: string) {
  const storeId = await getStoreIdForUser(userId);

  return db
    .select({
      id: payments.id,
      creditId: payments.creditId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      stellarTxHash: payments.stellarTxHash,
      createdAt: payments.createdAt,
      credit: {
        id: credits.id,
        amount: credits.amount,
        balance: credits.balance,
        status: credits.status,
      },
      customer: {
        id: customers.id,
        name: customers.name,
      },
    })
    .from(payments)
    .innerJoin(credits, eq(payments.creditId, credits.id))
    .innerJoin(customers, eq(credits.customerId, customers.id))
    .where(eq(credits.storeId, storeId))
    .orderBy(desc(payments.createdAt));
}

export async function createPaymentForUser(userId: string, input: RecordPaymentInput) {
  const storeId = await getStoreIdForUser(userId);

  const [credit] = await db
    .select()
    .from(credits)
    .where(and(eq(credits.id, input.creditId), eq(credits.storeId, storeId)))
    .limit(1);

  if (!credit) throw new AppError("Credit not found or unauthorized", 404);
  if (credit.status === "paid") throw new AppError("Credit is already paid", 400);
  if (credit.status === "voided") throw new AppError("Credit has been voided", 400);

  const currentBalance = Number(credit.balance);
  if (!Number.isFinite(currentBalance)) {
    throw new AppError("Credit balance is invalid", 500);
  }
  if (input.amount > currentBalance) {
    throw new AppError("Payment exceeds remaining balance", 400);
  }

  const newBalance = currentBalance - input.amount;
  const newStatus = newBalance === 0 ? "paid" : "partial";

  // Best-effort Soroban sync — DB write succeeds regardless.
  // Only attempted if this credit was originally synced to the chain.
  // TODO: add USDC transfer_from here once customer wallet approval flow exists
  let txHash: string | null = null;
  let syncStatus: "synced" | "failed" | "pending" = "pending";

  if (credit.onChainCreditId) {
    try {
      const result = await recordPaymentOnChain({
        onChainCreditId: credit.onChainCreditId,
        amount: input.amount,
      });
      txHash = result.txHash;
      syncStatus = "synced";
    } catch (err) {
      console.error("[Stellar] recordPaymentOnChain failed:", err);
      syncStatus = "failed";
    }
  }

  return db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(payments)
      .values({
        id: randomUUID(),
        creditId: input.creditId,
        amount: input.amount.toString(),
        paymentMethod: input.paymentMethod,
        stellarTxHash: txHash,
      })
      .returning();

    await tx
      .update(credits)
      .set({
        balance: newBalance.toString(),
        status: newStatus,
        syncStatus,
        stellarTxHash: txHash ?? credit.stellarTxHash,
        updatedAt: new Date(),
      })
      .where(eq(credits.id, input.creditId));

    return { ...payment, syncStatus, stellarTxHash: txHash };
  });
}
