import { and, count, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { credits, customers, stores } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import { recordPaymentOnChain } from "../stellar/stellar.service.js";
import type { CreateCreditInput, ListCreditsQuery, PayCreditInput } from "./credits.schema.js";

type CreditStatus = "pending" | "partial" | "paid" | "overdue";
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
  const whereClause = query.customerId
    ? and(eq(credits.storeId, storeId), eq(credits.customerId, query.customerId))
    : eq(credits.storeId, storeId);
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

  const [credit] = await db
    .insert(credits)
    .values({
      id: randomUUID(),
      storeId,
      customerId: input.customerId,
      amount: input.amount.toString(),
      balance: input.amount.toString(),
      status: "pending" satisfies CreditStatus,
      syncStatus: "pending" satisfies SyncStatus,
      note: input.note?.trim() || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    })
    .returning();

  return toCreditResponse(credit, customer.name);
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

  const currentBalance = Number(credit.balance);
  if (!Number.isFinite(currentBalance)) {
    throw new AppError("Credit balance is invalid", 500);
  }

  if (input.amount > currentBalance) {
    throw new AppError("Payment exceeds remaining balance", 400);
  }

  const newBalance = currentBalance - input.amount;
  const newStatus = (newBalance === 0 ? "paid" : "partial") satisfies CreditStatus;

  // Blockchain sync is metadata for the MVP; recording a payment still succeeds if this is later replaced.
  const { txHash } = await recordPaymentOnChain({
    creditId: id,
    amount: input.amount,
  });

  const [updated] = await db
    .update(credits)
    .set({
      balance: newBalance.toString(),
      status: newStatus,
      stellarTxHash: txHash,
      syncStatus: txHash ? "synced" : "pending",
      updatedAt: new Date(),
    })
    .where(eq(credits.id, id))
    .returning();

  return toCreditResponse(updated);
}
