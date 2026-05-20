import { Router, Request, Response, NextFunction } from "express";
import { createStoreSchema, dashboardQuerySchema } from "./stores.schema.js";
import { saveStore, getDashboardSummary, getStore } from "./stores.service.js";
import { authenticate } from "../../middleware/authenticate.js";

export const storesRouter = Router();

storesRouter.use(authenticate);

// GET /stores/dashboard
storesRouter.get("/dashboard", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = dashboardQuerySchema.parse(req.query);
    const result = await getDashboardSummary(req.user!.id, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /stores
storesRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createStoreSchema.parse(req.body);
    const result = await saveStore(req.user!.id, input);
    res.status(result.created ? 201 : 200).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /stores/me
storesRouter.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getStore(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
