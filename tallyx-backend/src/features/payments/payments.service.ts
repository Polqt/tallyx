import { and, desc, eq, lt, sql } from "drizzle-orm";
import { auditLog } from "../../middleware/audit.js";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { payments, credits, customers, stores } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import { recordPaymentOnChain } from "../stellar/stellar.service.js";
import type { RecordPaymentInput, ListPaymentsQuery } from "./payments.schema.js";

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

  return db
    .select({
      id: payments.id,
      creditId: payments.creditId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      stellarTxHash: payments.stellarTxHash,
      syncStatus: payments.syncStatus,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(credits, eq(payments.creditId, credits.id))
    .where(and(eq(payments.creditId, creditId), eq(credits.storeId, storeId)))
    .orderBy(desc(payments.createdAt));
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
      syncStatus: payments.syncStatus,
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

export async function getPaymentsForUser(userId: string, query: ListPaymentsQuery) {
  const storeId = await getStoreIdForUser(userId);

  const cursorCondition = query.cursor
    ? lt(payments.createdAt, new Date(query.cursor))
    : undefined;

  const rows = await db
    .select({
      id: payments.id,
      creditId: payments.creditId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      stellarTxHash: payments.stellarTxHash,
      syncStatus: payments.syncStatus,
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
    .where(and(eq(credits.storeId, storeId), cursorCondition))
    .orderBy(desc(payments.createdAt))
    .limit(query.limit + 1);

  const hasMore = rows.length > query.limit;
  const items = hasMore ? rows.slice(0, query.limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

  return { items, hasMore, nextCursor };
}

export async function createPaymentForUser(userId: string, input: RecordPaymentInput) {
  const storeId = await getStoreIdForUser(userId);

  // Quick pre-flight: verify the credit exists and belongs to this store before
  // entering the transaction. The authoritative balance check happens inside the
  // transaction with FOR UPDATE to prevent concurrent payments from racing.
  const [preflight] = await db
    .select({ id: credits.id })
    .from(credits)
    .where(and(eq(credits.id, input.creditId), eq(credits.storeId, storeId)))
    .limit(1);

  if (!preflight) throw new AppError("Credit not found or unauthorized", 404);

  try {
  return await db.transaction(async (tx) => {
    // Idempotency check inside the transaction so concurrent duplicates can't
    // both pass before either one has committed (the UNIQUE constraint is the
    // final backstop, but checking here avoids a confusing constraint error).
    if (input.idempotencyKey) {
      const [existing] = await tx
        .select()
        .from(payments)
        .where(eq(payments.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (existing) return existing;
    }

    // Lock the credit row for the duration of this transaction. Any concurrent
    // payment on the same credit will block at this point until we commit,
    // preventing two requests from both reading the same balance and both passing.
    await tx.execute(
      sql`SELECT id FROM credits WHERE id = ${input.creditId} FOR UPDATE`
    );

    // Re-read inside the transaction after acquiring the lock.
    const [credit] = await tx
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

    const newBalance = Math.round((currentBalance - input.amount) * 100) / 100;
    const newStatus = newBalance <= 0 ? "paid" : "partial";

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

    const [payment] = await tx
      .insert(payments)
      .values({
        id: randomUUID(),
        creditId: input.creditId,
        idempotencyKey: input.idempotencyKey ?? null,
        amount: input.amount.toString(),
        paymentMethod: input.paymentMethod,
        stellarTxHash: txHash,
        syncStatus,
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

    auditLog("payment.recorded", {
      paymentId: payment.id,
      creditId: input.creditId,
      storeId,
      userId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      syncStatus,
    });
    return payment;
  });
  } catch (err: unknown) {
    // If two identical idempotency keys raced past the in-transaction check,
    // the DB UNIQUE constraint fires (Postgres error code 23505).
    // Return the existing payment instead of a 500.
    const isUniqueViolation = typeof err === 'object' && err !== null && (err as Record<string, unknown>).code === '23505';
    if (input.idempotencyKey && isUniqueViolation) {
      const [existing] = await db
        .select()
        .from(payments)
        .where(eq(payments.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (existing) return existing;
    }
    throw err;
  }
}

export async function retrySyncPaymentForUser(userId: string, paymentId: string) {
  const storeId = await getStoreIdForUser(userId);

  const [row] = await db
    .select({
      payment: payments,
      credit: credits,
    })
    .from(payments)
    .innerJoin(credits, eq(payments.creditId, credits.id))
    .where(and(eq(payments.id, paymentId), eq(credits.storeId, storeId)))
    .limit(1);

  if (!row) throw new AppError("Payment not found", 404);
  if (row.payment.syncStatus !== "failed") throw new AppError("Payment sync has not failed — no retry needed", 400);
  if (!row.credit.onChainCreditId) throw new AppError("Cannot retry sync: credit was never synced to chain", 400);

  let txHash: string | null = null;
  let syncStatus: "synced" | "failed" = "failed";

  try {
    const result = await recordPaymentOnChain({
      onChainCreditId: row.credit.onChainCreditId,
      amount: Number(row.payment.amount),
    });
    txHash = result.txHash;
    syncStatus = "synced";
  } catch (err) {
    console.error("[Stellar] retrySyncPayment failed:", err);
  }

  const [updated] = await db
    .update(payments)
    .set({ syncStatus, stellarTxHash: txHash ?? row.payment.stellarTxHash })
    .where(eq(payments.id, paymentId))
    .returning();

  auditLog("payment.sync_retried", { paymentId, storeId, userId, syncStatus });
  return updated;
}
