import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { AppError } from "../../middleware/errorHandler.js";
import { recordPaymentSchema } from "./payments.schema.js";
import {
  getPaymentForUser,
  getPaymentsByCreditId,
  getPaymentsForUser,
  createPaymentForUser,
} from "./payments.service.js";

export const paymentRouter = Router();

// Secure all payment endpoints with JWT authentication
paymentRouter.use(authenticate);

// GET /payments
// Retrieves the global transaction history of payments for the authenticated user's store
paymentRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await getPaymentsForUser(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /payments
// Records a partial or full payment on a credit entry
paymentRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const input = recordPaymentSchema.parse(req.body);
    const data = await createPaymentForUser(req.user.id, input);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /payments/:id
paymentRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await getPaymentForUser(req.user.id, req.params.id as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /payments/credit/:creditId
// Legacy helper to get payments for a specific credit
paymentRouter.get("/credit/:creditId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await getPaymentsByCreditId(req.user.id, req.params.creditId as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
