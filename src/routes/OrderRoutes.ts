import { Router } from "express";
import { OrderController } from "../controllers";
import { validate } from "../middlewares/validate";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateVendorAccess } from "../middlewares/vendorMiddleware";

const orderRouter = Router();

orderRouter.post(
  "/",
  authMiddleware,
  validateVendorAccess,
  OrderController.createOrder
);
orderRouter.get(
  "/",
  authMiddleware,
  validateVendorAccess,
  OrderController.getOrders
);
orderRouter.get(
  "/:id",
  authMiddleware,
  validateVendorAccess,
  OrderController.getOrderById
);
orderRouter.put(
  "/:id",
  authMiddleware,
  validateVendorAccess,
  OrderController.updateOrderStatus
);
orderRouter.put(
  "/payment/:id",
  authMiddleware,
  validateVendorAccess,
  OrderController.updatePaymentStatus
);
orderRouter.get(
  "/stats",
  authMiddleware,
  validateVendorAccess,
  OrderController.getOrderStats
);
orderRouter.get(
  "/cancel-order/:id",
  authMiddleware,
  validateVendorAccess,
  OrderController.cancelOrder
);

export default orderRouter;
