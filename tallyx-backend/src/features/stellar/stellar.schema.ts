import { z } from "zod";

export const createCreditOnChainSchema = z.object({
  customerId: z.string().uuid(),
  creditId: z.string().uuid(),
  amount: z.number().int().positive(),
});

export const recordPaymentOnChainSchema = z.object({
  creditId: z.string().uuid(),
  amount: z.number().int().positive(),
});
