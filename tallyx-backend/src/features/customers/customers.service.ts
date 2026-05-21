import { and, count, desc, eq, ilike, inArray, max, or, sql, sum } from "drizzle-orm";
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

  // Aggregate balance and last transaction date in SQL — avoids loading every
  // credit row into memory when a customer has many credits.
  const creditAggRows = customerIds.length
    ? await db
        .select({
          customerId: credits.customerId,
          balance: sum(credits.balance),
          lastTransactionDate: max(credits.createdAt),
        })
        .from(credits)
        .where(and(eq(credits.storeId, storeId), inArray(credits.customerId, customerIds)))
        .groupBy(credits.customerId)
    : [];

  const creditAggByCustomerId = new Map(
    creditAggRows.map((row) => [row.customerId, row])
  );

  const items = customerRows.map((customer) => {
    const agg = creditAggByCustomerId.get(customer.id);
    return {
      ...customer,
      qrIdentity: toQrIdentity(customer.id, customer.storeId),
      balance: toNumber(agg?.balance),
      lastTransactionDate: agg?.lastTransactionDate?.toISOString() ?? null,
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
        .limit(50)
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

  const [updated] = await db
    .update(customers)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
      ...(input.email !== undefined ? { email: input.email ?? null } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(customers.id, customerId), eq(customers.storeId, storeId)))
    .returning();

  if (!updated) throw new AppError("Customer not found", 404);

  return {
    ...updated,
    qrIdentity: toQrIdentity(updated.id, updated.storeId),
    balance: 0,
    lastTransactionDate: null,
  };
}

export async function deleteCustomerForUser(userId: string, customerId: string) {
  const storeId = await getStoreIdForUser(userId);

  await db.transaction(async (tx) => {
    // Lock the customer row first so concurrent payments can't sneak in
    // between the balance check and the delete.
    await tx.execute(sql`SELECT id FROM customers WHERE id = ${customerId} FOR UPDATE`);

    const [customer] = await tx
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.storeId, storeId)))
      .limit(1);

    if (!customer) throw new AppError("Customer not found", 404);

    const [creditCountRow] = await tx
      .select({ total: count() })
      .from(credits)
      .where(and(eq(credits.customerId, customerId), eq(credits.storeId, storeId)));

    if ((creditCountRow?.total ?? 0) > 0) {
      throw new AppError(
        "Cannot delete a customer who has credit history. Void or settle all credits first.",
        400
      );
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
      email: input.email ?? null,
    })
    .returning();

  return {
    ...customer,
    qrIdentity: toQrIdentity(customer.id, customer.storeId),
    balance: 0,
    lastTransactionDate: null,
  };
}
