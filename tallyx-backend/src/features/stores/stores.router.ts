import { Router, Request, Response, NextFunction } from "express";
import { createStoreSchema } from "./stores.schema.js";
import { saveStore, getStore } from "./stores.service.js";
import { authenticate } from "../../middleware/authenticate.js";

export const storesRouter = Router();

storesRouter.use(authenticate);

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
