import { Router } from "express";
import authRouter from "./AuthRoutes";
import { sanitizeInput } from "../middlewares/sanitizeInput";

const router = Router();

router.use(sanitizeInput)

router.use("/auth", authRouter);

export default router;
