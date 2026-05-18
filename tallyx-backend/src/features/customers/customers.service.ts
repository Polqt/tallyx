import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { credits, customers, stores } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { CreateCustomerInput } from "./customers.schema.js";

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

export async function getCustomersForUser(userId: string) {
  const storeId = await getStoreIdForUser(userId);
  const [customerRows, creditRows] = await Promise.all([
    db.select().from(customers).where(eq(customers.storeId, storeId)),
    db.select().from(credits).where(eq(credits.storeId, storeId)),
  ]);

  return customerRows.map((customer) => {
    const customerCredits = creditRows.filter((credit) => credit.customerId === customer.id);
    const balance = customerCredits.reduce((sum, credit) => sum + toNumber(credit.balance), 0);
    const lastCredit = customerCredits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    return {
      ...customer,
      balance,
      lastTransactionDate: lastCredit?.createdAt.toISOString(),
    };
  });
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

  const totalCredit = customerCredits.reduce((sum, credit) => sum + toNumber(credit.amount), 0);
  const balance = customerCredits.reduce((sum, credit) => sum + toNumber(credit.balance), 0);

  return {
    ...customer,
    balance,
    totalCredit,
    totalPaid: totalCredit - balance,
    credits: customerCredits.map((credit) => ({
      id: credit.id,
      amount: toNumber(credit.amount),
      balance: toNumber(credit.balance),
      status: credit.status,
      date: credit.createdAt.toISOString(),
      dueDate: credit.dueDate?.toISOString() ?? null,
      stellarTxHash: credit.stellarTxHash,
    })),
  };
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
    balance: 0,
    lastTransactionDate: null,
  };
}
