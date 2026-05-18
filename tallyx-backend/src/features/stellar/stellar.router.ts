import { Router, Request, Response, NextFunction } from "express";
import { createCreditOnChainSchema, recordPaymentOnChainSchema } from "./stellar.schema.js";
import { createCreditOnChain, recordPaymentOnChain } from "./stellar.service.js";

export const stellarRouter = Router();

// POST /stellar/create-credit
stellarRouter.post("/create-credit", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createCreditOnChainSchema.parse(req.body);
    const result = await createCreditOnChain(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /stellar/record-payment
stellarRouter.post("/record-payment", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = recordPaymentOnChainSchema.parse(req.body);
    const result = await recordPaymentOnChain(input);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
