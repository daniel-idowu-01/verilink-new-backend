import { Router } from "express";
import authRouter from "./AuthRoutes";
import analyticsRouter from "./AnalyticsRoutes";
import productRouter from "./ProductRoutes";
import orderRouter from "./OrderRoutes";
import { sanitizeInput } from "../middlewares/sanitizeInput";

const router = Router();

router.use(sanitizeInput);

router.use("/auth", authRouter);
router.use("/analytics", analyticsRouter);
router.use("/products", productRouter);
router.use("/order", orderRouter);

export default router;
