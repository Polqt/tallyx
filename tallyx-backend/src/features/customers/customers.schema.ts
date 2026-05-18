import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
