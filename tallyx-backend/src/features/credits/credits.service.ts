import { and, count, desc, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { credits, customers, payments, stores } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import { createCreditOnChain } from "../stellar/stellar.service.js";
import type { CreateCreditInput, ListCreditsQuery, PayCreditInput, UpdateCreditInput } from "./credits.schema.js";

type CreditStatus = "pending" | "partial" | "paid" | "overdue" | "voided";
type SyncStatus = "pending" | "synced" | "failed";

async function getStoreIdForUser(userId: string) {
  const [store] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.userId, userId))
    .limit(1);

  if (!store) throw new AppError("Store not found", 404);
  return store.id;
}

function toNumber(value: string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCreditStatus(credit: typeof credits.$inferSelect): CreditStatus {
  if (credit.status === "voided") return "voided";
  if (credit.status === "paid") return "paid";
  if (credit.dueDate && credit.dueDate < new Date() && toNumber(credit.balance) > 0) return "overdue";
  if (credit.status === "partial") return "partial";
  return "pending";
}

function toCreditResponse(credit: typeof credits.$inferSelect, customerName?: string) {
  return {
    id: credit.id,
    storeId: credit.storeId,
    customerId: credit.customerId,
    customerName: customerName ?? null,
    amount: toNumber(credit.amount),
    balance: toNumber(credit.balance),
    status: getCreditStatus(credit),
    note: credit.note,
    dueDate: credit.dueDate?.toISOString() ?? null,
    stellarTxHash: credit.stellarTxHash,
    syncStatus: (credit.syncStatus as SyncStatus) ?? "pending",
    createdAt: credit.createdAt.toISOString(),
    updatedAt: credit.updatedAt.toISOString(),
  };
}

async function getCustomerNames(storeId: string, customerIds: string[]) {
  if (customerIds.length === 0) return new Map<string, string>();

  const customerRows = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(and(eq(customers.storeId, storeId), inArray(customers.id, customerIds)));

  return new Map(customerRows.map((customer) => [customer.id, customer.name]));
}

export async function getCreditsForUser(userId: string, query: ListCreditsQuery) {
  const storeId = await getStoreIdForUser(userId);
  const now = new Date();

  const baseConditions = [
    eq(credits.storeId, storeId),
    ...(query.customerId ? [eq(credits.customerId, query.customerId)] : []),
  ];

  const statusConditions =
    query.status === "overdue"
      ? [ne(credits.status, "paid"), gt(credits.balance, "0"), lt(credits.dueDate, now)]
      : query.status
      ? [eq(credits.status, query.status)]
      : [];

  const whereClause = and(...baseConditions, ...statusConditions);
  const offset = (query.page - 1) * query.limit;

  const [creditRows, totalRows] = await Promise.all([
    db
      .select()
      .from(credits)
      .where(whereClause)
      .orderBy(desc(credits.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ total: count() }).from(credits).where(whereClause),
  ]);

  const total = totalRows[0]?.total ?? 0;
  const customerNames = await getCustomerNames(storeId, [...new Set(creditRows.map((credit) => credit.customerId))]);

  return {
    items: creditRows.map((credit) => toCreditResponse(credit, customerNames.get(credit.customerId))),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasMore: offset + creditRows.length < total,
    },
  };
}

export async function createCreditForUser(userId: string, input: CreateCreditInput) {
  const storeId = await getStoreIdForUser(userId);
  const [customer] = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(and(eq(customers.id, input.customerId), eq(customers.storeId, storeId)))
    .limit(1);

  if (!customer) throw new AppError("Customer not found", 404);

  const creditId = randomUUID();
  const dueDate = input.dueDate ? new Date(input.dueDate) : null;

  // Submit to Soroban — best-effort; credit is saved regardless
  let txHash: string | null = null;
  let onChainCreditId: number | null = null;
  let syncStatus: SyncStatus = "pending";
  try {
    const result = await createCreditOnChain({
      creditId,
      customerId: input.customerId,
      storeId,
      amount: input.amount,
      dueDateUnix: dueDate ? Math.floor(dueDate.getTime() / 1000) : undefined,
    });
    txHash = result.txHash;
    onChainCreditId = result.onChainCreditId ?? null;
    syncStatus = "synced";
  } catch (err) {
    console.error("[Stellar] createCreditOnChain failed:", err);
    syncStatus = "failed";
  }

  const [credit] = await db
    .insert(credits)
    .values({
      id: creditId,
      storeId,
      customerId: input.customerId,
      amount: input.amount.toString(),
      balance: input.amount.toString(),
      status: "pending" satisfies CreditStatus,
      syncStatus,
      note: input.note?.trim() || null,
      dueDate,
      stellarTxHash: txHash,
      onChainCreditId,
    })
    .returning();

  return toCreditResponse(credit, customer.name);
}

export async function getCreditForUser(userId: string, id: string) {
  const storeId = await getStoreIdForUser(userId);
  const [credit] = await db
    .select()
    .from(credits)
    .where(and(eq(credits.id, id), eq(credits.storeId, storeId)))
    .limit(1);

  if (!credit) throw new AppError("Credit not found", 404);

  const customerNames = await getCustomerNames(storeId, [credit.customerId]);
  return toCreditResponse(credit, customerNames.get(credit.customerId));
}

export async function voidCreditForUser(userId: string, id: string) {
  const storeId = await getStoreIdForUser(userId);
  const [credit] = await db
    .select()
    .from(credits)
    .where(and(eq(credits.id, id), eq(credits.storeId, storeId)))
    .limit(1);
  if (!credit) throw new AppError("Credit not found", 404);
  if (credit.status === "paid") throw new AppError("Cannot void a fully paid credit", 400);
  if (credit.status === "voided") throw new AppError("Credit is already voided", 400);

  const [updated] = await db.transaction(async (tx) => {
    const [paymentCount] = await tx
      .select({ total: count() })
      .from(payments)
      .where(eq(payments.creditId, id));
    if ((paymentCount?.total ?? 0) > 0) {
      throw new AppError("Cannot void a credit that has payments recorded against it", 400);
    }
    return tx
      .update(credits)
      .set({ status: "voided", balance: "0", updatedAt: new Date() })
      .where(eq(credits.id, id))
      .returning();
  });

  return toCreditResponse(updated);
}

export async function unvoidCreditForUser(userId: string, id: string) {
  const storeId = await getStoreIdForUser(userId);
  const [credit] = await db
    .select()
    .from(credits)
    .where(and(eq(credits.id, id), eq(credits.storeId, storeId)))
    .limit(1);
  if (!credit) throw new AppError("Credit not found", 404);
  if (credit.status !== "voided") throw new AppError("Credit is not voided", 400);

  const [updated] = await db
    .update(credits)
    .set({ status: "pending", balance: credit.amount, updatedAt: new Date() })
    .where(eq(credits.id, id))
    .returning();

  const customerNames = await getCustomerNames(storeId, [updated.customerId]);
  return toCreditResponse(updated, customerNames.get(updated.customerId));
}

export async function updateCreditForUser(userId: string, id: string, input: UpdateCreditInput) {
  const storeId = await getStoreIdForUser(userId);
  const [credit] = await db
    .select()
    .from(credits)
    .where(and(eq(credits.id, id), eq(credits.storeId, storeId)))
    .limit(1);
  if (!credit) throw new AppError("Credit not found", 404);
  if (credit.status === "paid") throw new AppError("Cannot edit a fully paid credit", 400);
  if (credit.status === "voided") throw new AppError("Cannot edit a voided credit", 400);

  const [updated] = await db
    .update(credits)
    .set({
      note: input.note !== undefined ? (input.note?.trim() || null) : credit.note,
      dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : credit.dueDate,
      updatedAt: new Date(),
    })
    .where(eq(credits.id, id))
    .returning();

  const customerNames = await getCustomerNames(storeId, [updated.customerId]);
  return toCreditResponse(updated, customerNames.get(updated.customerId));
}

export async function deleteCreditForUser(userId: string, id: string) {
  const storeId = await getStoreIdForUser(userId);
  const [credit] = await db
    .select()
    .from(credits)
    .where(and(eq(credits.id, id), eq(credits.storeId, storeId)))
    .limit(1);
  if (!credit) throw new AppError("Credit not found", 404);

  await db.transaction(async (tx) => {
    const [paymentCount] = await tx
      .select({ total: count() })
      .from(payments)
      .where(eq(payments.creditId, id));
    if ((paymentCount?.total ?? 0) > 0) {
      throw new AppError("Cannot delete a credit that has payments recorded against it", 400);
    }
    await tx.delete(credits).where(eq(credits.id, id));
  });
  return { id };
}

export async function payCreditForUser(userId: string, id: string, input: PayCreditInput) {
  const storeId = await getStoreIdForUser(userId);
  const [credit] = await db
    .select()
    .from(credits)
    .where(and(eq(credits.id, id), eq(credits.storeId, storeId)))
    .limit(1);
  if (!credit) throw new AppError("Credit not found", 404);
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
  const newStatus = (newBalance === 0 ? "paid" : "partial") satisfies CreditStatus;

  // Stellar sync for payments is handled by payments.service.ts#createPaymentForUser.
  // payCreditForUser only updates the DB balance/status.
  const [updated] = await db
    .update(credits)
    .set({
      balance: newBalance.toString(),
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(credits.id, id))
    .returning();

  return toCreditResponse(updated);
}
