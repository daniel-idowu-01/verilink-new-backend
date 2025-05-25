import helmet from "helmet";
import { config } from "../config/config";
import rateLimit from "express-rate-limit";
import { TooManyRequestsError } from "../utils/errors";
import { Request, Response, NextFunction } from "express";

// Enhanced rate limiting with different limits for different endpoints
export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || config.RATE_LIMIT_WINDOW_MS,
    max: options?.max || config.RATE_LIMIT_MAX_REQUESTS,
    skipSuccessfulRequests: options?.skipSuccessfulRequests || false,
    handler: (req, res, next) => {
      next(
        new TooManyRequestsError("Too many requests, please try again later")
      );
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Strict rate limiting for auth endpoints
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
});

// General API rate limiting
export const apiRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Enhanced helmet configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Request sanitization
export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Remove null bytes
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      return obj.replace(/\0/g, "");
    }
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};
