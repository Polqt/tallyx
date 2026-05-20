import { and, count, desc, eq, ilike, inArray, or, sum } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { credits, customers, payments, stores } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from "./customers.schema.js";

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

function toQrIdentity(customerId: string, storeId: string) {
  return JSON.stringify({
    type: "tallyx_customer_identity",
    version: 1,
    customerId,
    storeId,
  });
}

function getCreditStatus(credit: typeof credits.$inferSelect) {
  if (credit.status === "paid") return "paid";
  if (credit.dueDate && credit.dueDate < new Date() && toNumber(credit.balance) > 0) return "overdue";
  if (credit.status === "partial") return "partial";
  return "pending";
}

export async function getCustomersForUser(userId: string, query: ListCustomersQuery) {
  const storeId = await getStoreIdForUser(userId);
  const search = query.q?.trim();
  const whereClause = search
    ? and(
        eq(customers.storeId, storeId),
        or(ilike(customers.name, `%${search}%`), ilike(customers.phone, `%${search}%`))
      )
    : eq(customers.storeId, storeId);

  const offset = (query.page - 1) * query.limit;

  const [customerRows, totalRows] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ total: count() }).from(customers).where(whereClause),
  ]);

  const total = totalRows[0]?.total ?? 0;
  const customerIds = customerRows.map((customer) => customer.id);

  const creditRows = customerIds.length
    ? await db
        .select()
        .from(credits)
        .where(and(eq(credits.storeId, storeId), inArray(credits.customerId, customerIds)))
    : [];

  const creditsByCustomerId = new Map<string, typeof creditRows>();
  for (const credit of creditRows) {
    const customerCredits = creditsByCustomerId.get(credit.customerId) ?? [];
    customerCredits.push(credit);
    creditsByCustomerId.set(credit.customerId, customerCredits);
  }

  const items = customerRows.map((customer) => {
    const customerCredits = (creditsByCustomerId.get(customer.id) ?? []).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const balance = customerCredits.reduce((sum, credit) => sum + toNumber(credit.balance), 0);
    const lastCredit = customerCredits[0];

    return {
      ...customer,
      qrIdentity: toQrIdentity(customer.id, customer.storeId),
      balance,
      lastTransactionDate: lastCredit?.createdAt.toISOString() ?? null,
    };
  });

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasMore: offset + customerRows.length < total,
    },
  };
}

export async function getCustomerForUser(userId: string, id: string) {
  const storeId = await getStoreIdForUser(userId);
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.storeId, storeId)))
    .limit(1);

  if (!customer) throw new AppError("Customer not found", 404);

  const customerCredits = await db
    .select()
    .from(credits)
    .where(and(eq(credits.customerId, id), eq(credits.storeId, storeId)))
    .orderBy(desc(credits.createdAt));

  const creditIds = customerCredits.map((credit) => credit.id);
  const customerPayments = creditIds.length
    ? await db
        .select()
        .from(payments)
        .where(inArray(payments.creditId, creditIds))
        .orderBy(desc(payments.createdAt))
    : [];

  const totalCredit = customerCredits.reduce((sum, credit) => sum + toNumber(credit.amount), 0);
  const balance = customerCredits.reduce((sum, credit) => sum + toNumber(credit.balance), 0);

  return {
    ...customer,
    qrIdentity: toQrIdentity(customer.id, customer.storeId),
    balance,
    totalCredit,
    totalPaid: totalCredit - balance,
    credits: customerCredits.map((credit) => ({
      id: credit.id,
      amount: toNumber(credit.amount),
      balance: toNumber(credit.balance),
      status: getCreditStatus(credit),
      note: credit.note,
      date: credit.createdAt.toISOString(),
      dueDate: credit.dueDate?.toISOString() ?? null,
      stellarTxHash: credit.stellarTxHash,
      syncStatus: credit.syncStatus,
    })),
    payments: customerPayments.map((payment) => ({
      id: payment.id,
      creditId: payment.creditId,
      amount: toNumber(payment.amount),
      date: payment.createdAt.toISOString(),
      stellarTxHash: payment.stellarTxHash,
    })),
  };
}

export async function updateCustomerForUser(userId: string, customerId: string, input: UpdateCustomerInput) {
  const storeId = await getStoreIdForUser(userId);
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.storeId, storeId)))
    .limit(1);

  if (!customer) throw new AppError("Customer not found", 404);

  const [updated] = await db
    .update(customers)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId))
    .returning();

  return {
    ...updated,
    qrIdentity: toQrIdentity(updated.id, updated.storeId),
    balance: 0,
    lastTransactionDate: null,
  };
}

export async function deleteCustomerForUser(userId: string, customerId: string) {
  const storeId = await getStoreIdForUser(userId);

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.storeId, storeId)))
    .limit(1);

  if (!customer) throw new AppError("Customer not found", 404);

  const [balanceRow] = await db
    .select({ total: sum(credits.balance) })
    .from(credits)
    .where(and(eq(credits.customerId, customerId), eq(credits.storeId, storeId)));

  const outstandingBalance = Number(balanceRow?.total ?? 0);
  if (outstandingBalance > 0) {
    throw new AppError("Cannot delete a customer with an outstanding balance. Settle all credits first.", 400);
  }

  await db.transaction(async (tx) => {
    const customerCredits = await tx
      .select({ id: credits.id })
      .from(credits)
      .where(and(eq(credits.customerId, customerId), eq(credits.storeId, storeId)));

    const creditIds = customerCredits.map((c) => c.id);

    if (creditIds.length > 0) {
      await tx.delete(payments).where(inArray(payments.creditId, creditIds));
      await tx.delete(credits).where(inArray(credits.id, creditIds));
    }

    await tx.delete(customers).where(eq(customers.id, customerId));
  });
}

export async function createCustomerForUser(userId: string, input: CreateCustomerInput) {
  const storeId = await getStoreIdForUser(userId);
  const [customer] = await db
    .insert(customers)
    .values({
      id: randomUUID(),
      storeId,
      name: input.name,
      phone: input.phone ?? null,
    })
    .returning();

  return {
    ...customer,
    qrIdentity: toQrIdentity(customer.id, customer.storeId),
    balance: 0,
    lastTransactionDate: null,
  };
}
