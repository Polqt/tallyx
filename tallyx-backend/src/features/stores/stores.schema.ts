import { z } from "zod";

const stellarPublicKey = z
  .string()
  .regex(/^G[A-Z2-7]{55}$/, "Invalid Stellar public key format");

export const createStoreSchema = z.object({
  storeName: z.string().min(1).max(100),
  phoneNumber: z.string().max(20).optional(),
  stellarPublicKey: stellarPublicKey.optional(),
});

// Used when a store already exists — all fields optional, Stellar key never cleared.
export const updateStoreSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().max(20).optional().nullable(),
  stellarPublicKey: stellarPublicKey.optional(),
});

export const dashboardQuerySchema = z.object({
  period: z.enum(["all", "week", "month", "year"]).default("all"),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
