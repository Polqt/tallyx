import { z } from "zod";

export const recordPaymentSchema = z.object({
  creditId: z.string().uuid(),
  amount: z.number().int().positive().max(100_000_000),
  paymentMethod: z.enum(["cash", "usdc"]),
  stellarTxHash: z.string().optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
