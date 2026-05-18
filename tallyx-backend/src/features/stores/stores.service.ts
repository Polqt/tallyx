import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { credits, customers, stores } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { CreateStoreInput } from "./stores.schema.js";

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

export async function getDashboardSummary(userId: string) {
  const { store } = await getStore(userId);
  const [customerRows, creditRows] = await Promise.all([
    db.select().from(customers).where(eq(customers.storeId, store.id)),
    db.select().from(credits).where(eq(credits.storeId, store.id)).orderBy(desc(credits.createdAt)),
  ]);

  const now = new Date();
  const openCredits = creditRows.filter((credit) => Number(credit.balance) > 0 && credit.status !== "paid");
  const overdueCredits = openCredits.filter((credit) => credit.dueDate && credit.dueDate < now);
  const totalReceivables = openCredits.reduce((sum, credit) => sum + Number(credit.balance), 0);
  const overdueAmount = overdueCredits.reduce((sum, credit) => sum + Number(credit.balance), 0);

  return {
    totals: {
      totalReceivables,
      overdueAmount,
      customerCount: customerRows.length,
      openCreditsCount: openCredits.length,
    },
    recentActivity: creditRows.slice(0, 5).map((credit) => ({
      id: credit.id,
      type: "credit" as const,
      title: "Credit recorded",
      amount: Number(credit.amount),
      status: credit.status,
      createdAt: credit.createdAt.toISOString(),
      stellarTxHash: credit.stellarTxHash,
    })),
  };
}
