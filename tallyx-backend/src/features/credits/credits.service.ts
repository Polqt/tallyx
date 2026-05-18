import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { credits } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import { recordPaymentOnChain } from "../stellar/stellar.service.js";
import type { CreateCreditInput, PayCreditInput } from "./credits.schema.js";

export async function getAllCredits() {
  return db.select().from(credits);
}

export async function getCreditsByCustomer(customerId: string) {
  return db.select().from(credits).where(eq(credits.customerId, customerId));
}

export async function createCredit(input: CreateCreditInput) {
  const [credit] = await db
    .insert(credits)
    .values({
      id: randomUUID(),
      customerId: input.customerId,
      amount: input.amount,
      balance: input.amount,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    })
    .returning();

  return credit;
}

export async function payCredit(id: string, input: PayCreditInput) {
  const [credit] = await db.select().from(credits).where(eq(credits.id, id));
  if (!credit) throw new AppError("Credit not found", 404);
  if (credit.status === "paid") throw new AppError("Credit is already paid", 400);
  if (input.amount > credit.balance) {
    throw new AppError("Payment exceeds remaining balance", 400);
  }

  const newBalance = credit.balance - input.amount;
  const newStatus = newBalance === 0 ? "paid" : "active";

  // Record on Stellar (placeholder — returns mock tx hash)
  const { txHash } = await recordPaymentOnChain({
    creditId: id,
    amount: input.amount,
  });

  const [updated] = await db
    .update(credits)
    .set({ balance: newBalance, status: newStatus, stellarTxHash: txHash })
    .where(eq(credits.id, id))
    .returning();

  return updated;
}
