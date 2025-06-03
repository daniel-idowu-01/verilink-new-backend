import { Router } from "express";
import { AnalyticsController } from "../controllers";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateVendorAccess } from "../middlewares/vendorMiddleware";

const router = Router();

router.use(authMiddleware);
router.use(validateVendorAccess);

/**
 * @params  ?period=monthly&page=1&limit=10
 */
router.get("/dashboard", AnalyticsController.getDashboardReport);

/**
 * @params  ?startDate&endDate&customerName&orderStatus&page&limit
 */
router.get("/orders", AnalyticsController.getFilteredOrders);

/**
 * @params  ?startDate&endDate&groupBy=day
 */
router.get("/sales-summary", AnalyticsController.getSalesSummary);

/**
 * @params  ?format=csv&period=monthly
 */
router.get("/export", AnalyticsController.exportReport);

export default router;
