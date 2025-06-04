import { Router } from "express";
import { ProductController } from "../controllers";
import { validate } from "../middlewares/validate";
import {
  authMiddleware,
  refreshTokenMiddleware,
} from "../middlewares/authMiddleware";
import { validateVendorAccess } from "../middlewares/vendorMiddleware";
import {
  registerSchema,
  vendorRegisterSchema,
  loginSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "../validations/auth.schema";

const productRouter = Router();

productRouter.get("/", ProductController.getProducts);
productRouter.get("/:id", ProductController.getProductById);
productRouter.post(
  "/",
  authMiddleware,
  validateVendorAccess,
  ProductController.createProduct
);
productRouter.put(
  "/:id",
  authMiddleware,
  validateVendorAccess,
  ProductController.updateProduct
);
productRouter.put(
  "/:id",
  authMiddleware,
  validateVendorAccess,
  ProductController.updateProduct
);
productRouter.delete(
  "/:id",
  authMiddleware,
  validateVendorAccess,
  ProductController.deleteProduct
);
productRouter.get(
  "/toggle-availiability/:id",
  authMiddleware,
  validateVendorAccess,
  ProductController.toggleAvailability
);
productRouter.get(
  "/categories",
  authMiddleware,
  validateVendorAccess,
  ProductController.toggleAvailability
);
productRouter.put(
  "/bulk-update/:id",
  authMiddleware,
  validateVendorAccess,
  ProductController.updateProduct
);

export default productRouter;
