import { Router, Request, Response, NextFunction } from "express";
import { createStoreSchema, updateStoreSchema, dashboardQuerySchema } from "./stores.schema.js";
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

// POST /stores — creates or updates the authenticated user's store.
// On creation, storeName is required. On update, all fields are optional.
// The Stellar public key is never cleared by omitting it.
storesRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await getStore(req.user!.id).catch(() => null);
    const schema = existing ? updateStoreSchema : createStoreSchema;
    const input = schema.parse(req.body);
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
