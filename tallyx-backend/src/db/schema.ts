import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stores = pgTable("stores", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  storeName: text("store_name").notNull(),
  phoneNumber: text("phone_number"),
  stellarPublicKey: text("stellar_public_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("stores_user_id_idx").on(t.userId),
]);

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  storeId: text("store_id").notNull().references(() => stores.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("customers_store_id_idx").on(t.storeId),
]);

export const credits = pgTable("credits", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  storeId: text("store_id").notNull().references(() => stores.id),
  amount: text("amount").notNull(),
  balance: text("balance").notNull(),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  syncStatus: text("sync_status").notNull().default("pending"),
  dueDate: timestamp("due_date"),
  stellarTxHash: text("stellar_tx_hash"),
  onChainCreditId: bigint("on_chain_credit_id", { mode: "bigint" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("credits_store_id_idx").on(t.storeId),
  index("credits_customer_id_idx").on(t.customerId),
  index("credits_store_status_idx").on(t.storeId, t.status),
]);

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  creditId: text("credit_id").notNull().references(() => credits.id),
  idempotencyKey: text("idempotency_key").unique(),
  amount: text("amount").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"),
  stellarTxHash: text("stellar_tx_hash"),
  syncStatus: text("sync_status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("payments_credit_id_idx").on(t.creditId),
]);
