import { AuthController } from "./AuthController";
import { AnalyticsController } from "./AnalyticsController";
import { ProductController } from "./ProductController";
import { OrderController } from "./OrderController";

const authController = new AuthController();
const analyticsController = new AnalyticsController();
const productController = new ProductController();
const orderController = new OrderController();

export {
  authController as AuthController,
  analyticsController as AnalyticsController,
  productController as ProductController,
  orderController as OrderController,
};
