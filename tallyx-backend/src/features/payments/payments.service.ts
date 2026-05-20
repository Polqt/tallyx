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

export async function getPaymentsByCreditId(userId: string, creditId: string) {
  const storeId = await getStoreIdForUser(userId);

  const rows = await db
    .select({
      id: payments.id,
      creditId: payments.creditId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      stellarTxHash: payments.stellarTxHash,
      createdAt: payments.createdAt,
    })
    .from(credits)
    .leftJoin(payments, eq(credits.id, payments.creditId))
    .where(and(eq(credits.id, creditId), eq(credits.storeId, storeId)));

  if (rows.length === 0) {
    throw new AppError("Credit not found or unauthorized", 404);
  }

  // If there are no payments, leftJoin returns a single row with all payment fields as null
  if (rows.length === 1 && !rows[0].id) {
    return [];
  }

  return rows.map((row) => ({
    id: row.id!,
    creditId: row.creditId!,
    amount: row.amount!,
    paymentMethod: row.paymentMethod!,
    stellarTxHash: row.stellarTxHash,
    createdAt: row.createdAt!,
  }));
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

  // 1. Fetch and validate credit (scoped strictly to the user's store)
  const [credit] = await db
    .select()
    .from(credits)
    .where(and(eq(credits.id, input.creditId), eq(credits.storeId, storeId)))
    .limit(1);

  if (!credit) throw new AppError("Credit not found or unauthorized", 404);
  if (credit.status === "paid") throw new AppError("Credit is already paid", 400);

  const currentBalance = Number(credit.balance);
  if (!Number.isFinite(currentBalance)) {
    throw new AppError("Credit balance is invalid", 500);
  }

  if (input.amount > currentBalance) {
    throw new AppError("Payment exceeds remaining balance", 400);
  }

  const newBalance = currentBalance - input.amount;
  const newStatus = newBalance === 0 ? "paid" : "partial";

  // 2. Mock or real record on Stellar
  let txHash = input.stellarTxHash;
  if (input.paymentMethod === "usdc" && !txHash) {
    const onChainResult = await recordPaymentOnChain({
      creditId: input.creditId,
      amount: input.amount,
    });
    txHash = onChainResult.txHash;
  }

  // 3. Insert payment record inside database transaction to guarantee consistency
  return db.transaction(async (tx) => {
    // Insert into payments table
    const [payment] = await tx
      .insert(payments)
      .values({
        id: randomUUID(),
        creditId: input.creditId,
        amount: input.amount.toString(),
        paymentMethod: input.paymentMethod,
        stellarTxHash: txHash || null,
      })
      .returning();

    // Update credit balance and status
    await tx
      .update(credits)
      .set({
        balance: newBalance.toString(),
        status: newStatus,
        stellarTxHash: txHash || credit.stellarTxHash,
        updatedAt: new Date(),
      })
      .where(eq(credits.id, input.creditId));

    return payment;
  });
}
