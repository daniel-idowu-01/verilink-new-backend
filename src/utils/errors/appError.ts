export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly path?: string;

  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  abstract serializeErrors(): Array<{
    message: string;
    field?: string;
    code?: string;
  }>;

  toJSON() {
    return {
      name: this.constructor.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      timestamp: this.timestamp,
      details: this.details,
      errors: this.serializeErrors(),
    };
  }
}
