import { AuthController } from "./AuthController";
import { AnalyticsController } from "./AnalyticsController";

const authController = new AuthController();
const analyticsController = new AnalyticsController();

export {
  authController as AuthController,
  analyticsController as AnalyticsController,
};
