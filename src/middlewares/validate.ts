import { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error.errors) {
        const formattedErrors = error.errors.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        next(new ValidationError(formattedErrors));
      } else {
        next(error);
      }
    }
  };
