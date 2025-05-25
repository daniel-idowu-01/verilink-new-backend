import logger from "../utils/logger";
import { UserService } from "../services";
import { ApiResponse } from "../middlewares/responseHandler";
import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  ValidationError,
  ConflictError,
  InternalServerError,
} from "../utils/errors";

export class AuthController {
  register: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      logger.info("Registering user with email: " + req.body.email);
      const { email, password, firstName, lastName, phone } = req.body;

      const missingFields = [];
      if (!email)
        missingFields.push({ field: "email", message: "Email is required" });
      if (!password)
        missingFields.push({
          field: "password",
          message: "Password is required",
        });
      // if (!firstName) missingFields.push({ field: "firstName", message: "First name is required" });
      // if (!lastName) missingFields.push({ field: "lastName", message: "Last name is required" });
      // if (!phone) missingFields.push({ field: "phone", message: "Phone is required" });

      if (missingFields.length > 0) {
        throw new ValidationError(missingFields);
      }

      const user = await UserService.getUserByEmail(email, true);

      if (user) {
        throw new ConflictError("User already exists");
      }

      const newUser = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        phone,
      });

      if (!newUser) {
        throw new InternalServerError("User registration failed");
      }

      ApiResponse.created(
        res,
        {
          user: {
            id: newUser._id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phone: newUser.phone,
          },
        },
        "User registered successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  async login(req: any, res: any) {}

  async logout(req: any, res: any) {}

  async refreshToken(req: any, res: any) {}
}
