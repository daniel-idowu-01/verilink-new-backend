import { Router } from "express";
import { AuthController } from "../controllers";
import { validate } from "../middlewares/validate";
import {
  authMiddleware,
  refreshTokenMiddleware,
} from "../middlewares/authMiddleware";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "../validations/auth.schema";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), AuthController.register);
authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.get("/logout", authMiddleware, AuthController.logout);
authRouter.get(
  "/refresh-token",
  refreshTokenMiddleware,
  AuthController.refreshToken
);
authRouter.post(
  "/request-password-reset",
  authMiddleware,
  validate(requestPasswordResetSchema),
  AuthController.requestPasswordReset
);
authRouter.post(
  "/reset-password",
  authMiddleware,
  validate(resetPasswordSchema),
  AuthController.resetPassword
);
authRouter.post(
  "/verify-email",
  validate(verifyEmailSchema),
  AuthController.verifyEmail
);

export default authRouter;
