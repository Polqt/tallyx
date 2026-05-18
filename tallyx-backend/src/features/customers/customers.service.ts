import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { customers } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { CreateCustomerInput } from "./customers.schema.js";

export async function getAllCustomers() {
  return db.select().from(customers);
}

export async function getCustomerById(id: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));

  if (!customer) throw new AppError("Customer not found", 404);
  return customer;
}

export async function createCustomer(input: CreateCustomerInput) {
  const [customer] = await db
    .insert(customers)
    .values({ id: randomUUID(), ...input })
    .returning();

  return customer;
}
