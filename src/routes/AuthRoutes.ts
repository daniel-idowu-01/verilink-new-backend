import { Router } from "express";
import { AuthController } from "../controllers";

const authRouter = Router();

authRouter.post("/register", AuthController.register);

export default authRouter
