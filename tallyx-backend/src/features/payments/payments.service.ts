import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { payments } from "../../db/schema.js";

export async function getPaymentsByCreditId(creditId: string) {
  return db.select().from(payments).where(eq(payments.creditId, creditId));
}

export async function recordPayment(
  creditId: string,
  amount: number,
  stellarTxHash?: string
) {
  const [payment] = await db
    .insert(payments)
    .values({ id: randomUUID(), creditId, amount, stellarTxHash })
    .returning();

  return payment;
}
