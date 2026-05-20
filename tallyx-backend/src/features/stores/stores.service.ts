import { and, desc, eq, gte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { credits, customers, payments, stores } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { CreateStoreInput, DashboardQuery } from "./stores.schema.js";

function getPeriodStart(period: DashboardQuery["period"]): Date | null {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }
  return null;
}

export async function saveStore(userId: string, input: CreateStoreInput) {
  const [existingStore] = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, userId))
    .limit(1);

  if (existingStore) {
    const [store] = await db
      .update(stores)
      .set({
        storeName: input.storeName,
        phoneNumber: input.phoneNumber ?? null,
        stellarPublicKey: input.stellarPublicKey ?? existingStore.stellarPublicKey,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, existingStore.id))
      .returning();

    return { store, created: false };
  }

  const [store] = await db
    .insert(stores)
    .values({
      id: randomUUID(),
      userId,
      storeName: input.storeName,
      phoneNumber: input.phoneNumber ?? null,
      stellarPublicKey: input.stellarPublicKey ?? null,
    })
    .returning();

  return { store, created: true };
}

export async function getStore(userId: string) {
  const [store] = await db.select().from(stores).where(eq(stores.userId, userId)).limit(1);
  if (!store) throw new AppError("Store not found", 404);
  return { store };
}

export async function getDashboardSummary(userId: string, query: DashboardQuery = { period: "all" }) {
  const { store } = await getStore(userId);
  const periodStart = getPeriodStart(query.period);

  const creditWhere = periodStart
    ? and(eq(credits.storeId, store.id), gte(credits.createdAt, periodStart))
    : eq(credits.storeId, store.id);

  const paymentWhere = periodStart
    ? and(eq(credits.storeId, store.id), gte(payments.createdAt, periodStart))
    : eq(credits.storeId, store.id);

  const [customerRows, creditRows, paymentRows] = await Promise.all([
    db.select().from(customers).where(eq(customers.storeId, store.id)),
    db.select().from(credits).where(creditWhere).orderBy(desc(credits.createdAt)),
    db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        stellarTxHash: payments.stellarTxHash,
        createdAt: payments.createdAt,
        customerName: customers.name,
      })
      .from(payments)
      .innerJoin(credits, eq(payments.creditId, credits.id))
      .innerJoin(customers, eq(credits.customerId, customers.id))
      .where(paymentWhere)
      .orderBy(desc(payments.createdAt)),
  ]);

  const now = new Date();
  const openCredits = creditRows.filter((credit) => Number(credit.balance) > 0 && credit.status !== "paid");
  const overdueCredits = openCredits.filter((credit) => credit.dueDate && credit.dueDate < now);
  const totalReceivables = openCredits.reduce((sum, credit) => sum + Number(credit.balance), 0);
  const overdueAmount = overdueCredits.reduce((sum, credit) => sum + Number(credit.balance), 0);

  const creditActivity = creditRows.map((credit) => ({
    id: credit.id,
    type: "credit" as const,
    title: "Credit recorded",
    amount: Number(credit.amount),
    status: credit.dueDate && credit.dueDate < now && Number(credit.balance) > 0 ? "overdue" : credit.status,
    createdAt: credit.createdAt.toISOString(),
    stellarTxHash: credit.stellarTxHash,
    customerName: null as string | null,
  }));

  const paymentActivity = paymentRows.map((payment) => ({
    id: payment.id,
    type: "payment" as const,
    title: "Payment received",
    amount: Number(payment.amount),
    status: "paid" as const,
    createdAt: payment.createdAt.toISOString(),
    stellarTxHash: payment.stellarTxHash,
    customerName: payment.customerName,
  }));

  const recentActivity = [...creditActivity, ...paymentActivity]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return {
    totals: {
      totalReceivables,
      overdueAmount,
      customerCount: customerRows.length,
      openCreditsCount: openCredits.length,
    },
    recentActivity,
  };
}
