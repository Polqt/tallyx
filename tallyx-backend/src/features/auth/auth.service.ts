import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../db/client.js";
import { users, stores } from "../../db/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "24h";

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError("JWT_SECRET is not configured", 500);
  return jwt.sign({ id: userId }, secret, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

async function safeUser(user: typeof users.$inferSelect) {
  const { passwordHash: _, ...rest } = user;
  const [store] = await db.select().from(stores).where(eq(stores.userId, user.id)).limit(1);
  return { ...rest, hasStore: !!store };
}

export async function register(input: RegisterInput) {
  const email = input.email.toLowerCase().trim();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) throw new AppError("Email already registered", 409);

  const passwordHash = await bcrypt.hash(input.password, 12);

  const [user] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      ownerName: input.ownerName,
      email,
      passwordHash,
    })
    .returning();

  if (!user) throw new AppError("Registration failed", 500);

  const token = signToken(user.id);
  return { token, user: await safeUser(user) };
}

export async function login(input: LoginInput) {
  const email = input.email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) throw new AppError("Invalid credentials", 401);

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError("Invalid credentials", 401);

  const token = signToken(user.id);
  return { token, user: await safeUser(user) };
}

export async function getMe(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new AppError("User not found", 404);
  return { user: await safeUser(user) };
}

export async function forgotPassword(_identifier: string): Promise<never> {
  throw new AppError("Password reset is not yet implemented", 501);
}
