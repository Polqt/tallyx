import { Router, Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema, forgotPasswordSchema } from "./auth.schema.js";
import { register, login, getMe, forgotPassword } from "./auth.service.js";
import { authenticate } from "../../middleware/authenticate.js";

export const authRouter = Router();

// POST /auth/register
authRouter.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await register(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
authRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await login(input);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
authRouter.get("/me", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getMe(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/forgot-password
authRouter.post("/forgot-password", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = forgotPasswordSchema.parse(req.body);
    const result = await forgotPassword(identifier);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
