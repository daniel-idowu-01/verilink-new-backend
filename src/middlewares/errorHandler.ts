import { AppError } from "../utils/errors/appError";
import { ErrorRequestHandler, RequestHandler } from "express";
import {
  InternalServerError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from "../utils/errors";

// Global error handling middleware
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req,
  res,
  next
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.serializeErrors(),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    return;
  }

  // Handle mongoose duplicate key error
  if ((err as any).code === 11000) {
    const error = new ConflictError("Duplicate field value entered");
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.serializeErrors(),
    });
    return;
  }

  // Handle mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values((err as any).errors).map((e: any) => ({
      message: e.message,
      field: e.path,
    }));
    const validationError = new ValidationError(errors);
    res.status(validationError.statusCode).json({
      success: false,
      message: validationError.message,
      errors: validationError.serializeErrors(),
    });
    return;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    const error = new UnauthorizedError("Invalid token");
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.serializeErrors(),
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    const error = new UnauthorizedError("Token expired");
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.serializeErrors(),
    });
    return;
  }

  // Handle unexpected errors
  console.error("Unexpected error:", err);
  const error = new InternalServerError();
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.serializeErrors(),
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  const error = new NotFoundError(
    `Not found - ${req.method} ${req.originalUrl}`
  );
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.serializeErrors(),
  });
};
