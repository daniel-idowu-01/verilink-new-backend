import { AppError } from "./appError";

export class BadRequestError extends AppError {
  statusCode = 400;
  isOperational = true;

  constructor(public message: string, public code?: string) {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.code }];
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, code);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.code }];
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly isOperational = true;

  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, code);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.code }];
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, code);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.code }];
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly isOperational = true;

  constructor(message = "Resource conflict", code = "CONFLICT") {
    super(message, code);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.code }];
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(
    public errors: Array<{ message: string; field?: string; code?: string }>,
    code = "VALIDATION_ERROR"
  ) {
    super("Validation failed", code);
  }

  serializeErrors() {
    return this.errors;
  }
}

export class TooManyRequestsError extends AppError {
  readonly statusCode = 429;
  readonly isOperational = true;

  constructor(message = "Too many requests", code = "TOO_MANY_REQUESTS") {
    super(message, code);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.code }];
  }
}

export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly isOperational = false;

  constructor(message = "Internal server error", code = "INTERNAL_ERROR") {
    super(message, code);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.code }];
  }
}
