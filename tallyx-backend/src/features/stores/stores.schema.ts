import { z } from "zod";

export const createStoreSchema = z.object({
  storeName: z.string().min(1).max(100),
  phoneNumber: z.string().max(20).optional(),
  stellarPublicKey: z.string().optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
