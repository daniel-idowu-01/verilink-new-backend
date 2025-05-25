import { Router } from "express";
import { AuthController } from "../controllers";
import { validate } from "../middlewares/validate";
import { registerSchema } from "../validations/auth.schema";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), AuthController.register);

export default authRouter;
