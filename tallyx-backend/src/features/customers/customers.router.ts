import { Router, Request, Response, NextFunction } from "express";
import { createCustomerSchema, listCustomersQuerySchema } from "./customers.schema.js";
import {
  createCustomerForUser,
  getCustomerForUser,
  getCustomersForUser,
} from "./customers.service.js";
import { authenticate } from "../../middleware/authenticate.js";

export const customerRouter = Router();

customerRouter.use(authenticate);

// GET /customers
customerRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listCustomersQuerySchema.parse(req.query);
    const data = await getCustomersForUser(req.user!.id, query);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /customers/:id
customerRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getCustomerForUser(req.user!.id, req.params.id as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /customers
customerRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createCustomerSchema.parse(req.body);
    const data = await createCustomerForUser(req.user!.id, input);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});
