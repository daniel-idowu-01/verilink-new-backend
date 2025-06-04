import { Router } from "express";
import { AnalyticsController } from "../controllers";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateVendorAccess } from "../middlewares/vendorMiddleware";

const router = Router();

router.use(authMiddleware);
router.use(validateVendorAccess);

router.get("/dashboard", AnalyticsController.getDashboardReport);
router.get("/orders", AnalyticsController.getFilteredOrders);
router.get("/sales-summary", AnalyticsController.getSalesSummary);
router.get("/export", AnalyticsController.exportReport);

export default router;
