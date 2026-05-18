import { Router, Request, Response, NextFunction } from "express";
import { createCustomerSchema } from "./customers.schema.js";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
} from "./customers.service.js";

export const customerRouter = Router();

// GET /customers
customerRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getAllCustomers();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /customers/:id
customerRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getCustomerById(req.params.id as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /customers
customerRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createCustomerSchema.parse(req.body);
    const data = await createCustomer(input);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});
