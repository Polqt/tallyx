import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { writeLimiter } from "../../middleware/rateLimiters.js";
import { createCreditSchema, listCreditsQuerySchema, payCreditSchema, updateCreditSchema } from "./credits.schema.js";
import {
  createCreditForUser,
  deleteCreditForUser,
  getCreditForUser,
  getCreditsForUser,
  payCreditForUser,
  unvoidCreditForUser,
  updateCreditForUser,
  voidCreditForUser,
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

// GET /credits/:id
creditRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getCreditForUser(req.user!.id, req.params.id as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /credits
creditRouter.post("/", writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
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

// PATCH /credits/:id/void
creditRouter.patch("/:id/void", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await voidCreditForUser(req.user!.id, req.params.id as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /credits/:id/unvoid
creditRouter.patch("/:id/unvoid", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await unvoidCreditForUser(req.user!.id, req.params.id as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /credits/:id — edit note and dueDate
creditRouter.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateCreditSchema.parse(req.body);
    const data = await updateCreditForUser(req.user!.id, req.params.id as string, input);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /credits/:id
creditRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteCreditForUser(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
