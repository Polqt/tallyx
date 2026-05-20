import { z } from "zod";

export const createCreditOnChainSchema = z.object({
  customerId: z.string(),
  creditId: z.string().uuid(),
  storeId: z.string(),
  amount: z.number().int().positive(),
  dueDateUnix: z.number().int().nonnegative().optional(),
});

export const recordPaymentOnChainSchema = z.object({
  onChainCreditId: z.coerce.bigint().positive(),
  amount: z.number().int().positive(),
});
