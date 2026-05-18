import { z } from "zod";

export const createCreditSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().int().positive(),
  dueDate: z.string().datetime().optional(),
});

export const payCreditSchema = z.object({
  amount: z.number().int().positive(),
});

export type CreateCreditInput = z.infer<typeof createCreditSchema>;
export type PayCreditInput = z.infer<typeof payCreditSchema>;
