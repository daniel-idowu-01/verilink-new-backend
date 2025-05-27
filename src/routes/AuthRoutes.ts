import { Router } from "express";
import { AuthController } from "../controllers";
import { validate } from "../middlewares/validate";
import { authMiddleware, refreshTokenMiddleware } from "../middlewares/authMiddleware";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
} from "../validations/auth.schema";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), AuthController.register);
authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.get("/logout", authMiddleware, AuthController.logout);
authRouter.get("/refresh-token", refreshTokenMiddleware, AuthController.refreshToken);
authRouter.get("/request-password-reset", authMiddleware, AuthController.requestPasswordReset);
authRouter.post(
  "/verify-email",
  validate(verifyEmailSchema),
  AuthController.verifyEmail
);

export default authRouter;
