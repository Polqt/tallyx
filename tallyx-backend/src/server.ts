import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./features/auth/auth.router.js";
import { storesRouter } from "./features/stores/stores.router.js";
import { customerRouter } from "./features/customers/customers.router.js";
import { creditRouter } from "./features/credits/credits.router.js";
import { paymentRouter } from "./features/payments/payments.router.js";
import { stellarRouter } from "./features/stellar/stellar.router.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiters.js";
import { requestId } from "./middleware/requestId.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(requestId);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.trim()
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/auth", authLimiter, authRouter);
app.use("/stores", apiLimiter, storesRouter);
app.use("/customers", apiLimiter, customerRouter);
app.use("/credits", apiLimiter, creditRouter);
app.use("/payments", apiLimiter, paymentRouter);
app.use("/stellar", apiLimiter, stellarRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});


// Error handler must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
