import { z } from "zod";

export const createCreditSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().int().positive(),
  dueDate: z.string().datetime().optional(),
  note: z.string().trim().max(280).optional(),
});

export const listCreditsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  customerId: z.string().uuid().optional(),
  status: z.enum(["pending", "partial", "paid", "overdue", "voided"]).optional(),
});

export const payCreditSchema = z.object({
  amount: z.number().int().positive(),
});

export const updateCreditSchema = z.object({
  note: z.string().trim().max(280).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
}).refine((v) => v.note !== undefined || v.dueDate !== undefined, {
  message: "At least one field must be provided",
});

export type CreateCreditInput = z.infer<typeof createCreditSchema>;
export type ListCreditsQuery = z.infer<typeof listCreditsQuerySchema>;
export type PayCreditInput = z.infer<typeof payCreditSchema>;
export type UpdateCreditInput = z.infer<typeof updateCreditSchema>;
