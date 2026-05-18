import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { stores } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { CreateStoreInput } from "./stores.schema.js";

export async function createStore(userId: string, input: CreateStoreInput) {
  const existing = await db.select().from(stores).where(eq(stores.userId, userId)).limit(1);
  if (existing.length > 0) throw new AppError("Store already exists", 409);

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

  return { store };
}

export async function getStore(userId: string) {
  const [store] = await db.select().from(stores).where(eq(stores.userId, userId)).limit(1);
  if (!store) throw new AppError("Store not found", 404);
  return { store };
}
