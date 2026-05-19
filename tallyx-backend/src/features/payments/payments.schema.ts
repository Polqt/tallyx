import { z } from "zod";

export const recordPaymentSchema = z.object({
  creditId: z.string().uuid(),
  amount: z.number().int().positive(),
  paymentMethod: z.enum(["cash", "usdc"]),
  stellarTxHash: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
