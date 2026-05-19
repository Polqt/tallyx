import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { createCreditSchema, listCreditsQuerySchema, payCreditSchema } from "./credits.schema.js";
import {
  createCreditForUser,
  getCreditsForUser,
  payCreditForUser,
} from "./credits.service.js";

export const creditRouter = Router();

creditRouter.use(authenticate);

// GET /credits
creditRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listCreditsQuerySchema.parse(req.query);
    const data = await getCreditsForUser(req.user!.id, query);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /credits
creditRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createCreditSchema.parse(req.body);
    const data = await createCreditForUser(req.user!.id, input);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /credits/:id/pay
creditRouter.patch("/:id/pay", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = payCreditSchema.parse(req.body);
    const data = await payCreditForUser(req.user!.id, req.params.id as string, input);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
