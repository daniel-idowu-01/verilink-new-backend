import { Router } from "express";
import authRouter from "./AuthRoutes";
import analyticsRouter from "./AnalyticsRoutes"
import { sanitizeInput } from "../middlewares/sanitizeInput";

const router = Router();

router.use(sanitizeInput)

router.use("/auth", authRouter);
router.use("/analytics", analyticsRouter);

export default router;
