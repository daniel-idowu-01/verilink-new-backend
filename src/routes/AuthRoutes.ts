import { Router } from "express";
import { AuthController } from "../controllers";
import { validate } from "../middlewares/validate";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
} from "../validations/auth.schema";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), AuthController.register);
authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.post(
  "/verify-email",
  validate(verifyEmailSchema),
  AuthController.verifyEmail
);

export default authRouter;
