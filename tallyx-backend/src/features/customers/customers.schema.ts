import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().regex(/^[\d+\-()\s]{7,20}$/, "Invalid phone number format").optional(),
  email: z.string().trim().email("Invalid email address").optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().regex(/^[\d+\-()\s]{7,20}$/, "Invalid phone number format").optional().nullable(),
  email: z.string().trim().email("Invalid email address").optional().nullable(),
}).refine((v) => v.name !== undefined || v.phone !== undefined || v.email !== undefined, {
  message: "At least one field must be provided",
});

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(100).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
