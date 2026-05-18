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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/stores", storesRouter);
app.use("/customers", customerRouter);
app.use("/credits", creditRouter);
app.use("/payments", paymentRouter);
app.use("/stellar", stellarRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});


// Error handler must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
