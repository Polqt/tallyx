import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./features/auth/auth.router.js";
import { storesRouter } from "./features/stores/stores.router.js";
import { customerRouter } from "./features/customers/customers.router.js";
import { creditRouter } from "./features/credits/credits.router.js";
import { paymentRouter } from "./features/payments/payments.router.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiters.js";
import { requestId } from "./middleware/requestId.js";
import { db, pool } from "./db/client.js";
import { stores } from "./db/schema.js";
import { AppError } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(requestId);
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.ALLOWED_ORIGINS?.trim()) {
  console.error("ALLOWED_ORIGINS is not set in production. All cross-origin requests will be rejected.");
  process.exit(1);
}

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.trim()
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true,
}));
app.use(express.json({ limit: "100kb" }));

// Routes
app.use("/auth", authLimiter, authRouter);
app.use("/stores", apiLimiter, storesRouter);
app.use("/customers", apiLimiter, customerRouter);
app.use("/credits", apiLimiter, creditRouter);
app.use("/payments", apiLimiter, paymentRouter);

app.get("/health", async (_req, res, next) => {
  try {
    await db.select().from(stores).limit(1);
    res.json({ status: "ok" });
  } catch (err) {
    next(new AppError("Database unavailable", 503));
  }
});


// Error handler must be last
app.use(errorHandler);

const REQUIRED_ENV = [
  "JWT_SECRET",
  "DATABASE_URL",
  "STELLAR_SECRET_KEY",
  "CREDIT_CONTRACT_ID",
  "STELLAR_RPC_URL",
  "STELLAR_NETWORK",
] as const;

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
