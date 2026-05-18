import { Router, Request, Response, NextFunction } from "express";
import { createCreditSchema, payCreditSchema } from "./credits.schema.js";
import {
  getAllCredits,
  getCreditsByCustomer,
  createCredit,
  payCredit,
} from "./credits.service.js";

export const creditRouter = Router();

// GET /credits
creditRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getAllCredits();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /credits/customer/:customerId
creditRouter.get("/customer/:customerId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getCreditsByCustomer(req.params.customerId as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /credits
creditRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createCreditSchema.parse(req.body);
    const data = await createCredit(input);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /credits/:id/pay
creditRouter.patch("/:id/pay", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = payCreditSchema.parse(req.body);
    const data = await payCredit(req.params.id as string, input);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
