import { Router, Request, Response, NextFunction } from "express";
import { getPaymentsByCreditId } from "./payments.service.js";

export const paymentRouter = Router();

// GET /payments/credit/:creditId
paymentRouter.get("/credit/:creditId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getPaymentsByCreditId(req.params.creditId as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
