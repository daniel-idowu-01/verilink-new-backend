import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { UserRole, UserStatus } from "../models/interfaces/IUser";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { Request, Response, NextFunction, RequestHandler } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: UserRole[];
        vendorId?: string;
        status: UserStatus;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError("Access token required!");
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token",
        });
      }
      req.user = decoded as {
        id: string;
        email: string;
        roles: UserRole[];
        vendorId?: string;
        status: UserStatus;
      };
      next();
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token expired"));
    } else {
      next(error);
    }
  }
};

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // Also check cookies for token
  const cookieToken = req.cookies?.accessToken;
  return cookieToken || null;
};

// Middleware to check if the user has one of the allowed roles
export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const hasPermission = allowedRoles.some((role) =>
      req.user!.roles.includes(role)
    );
    if (!hasPermission) {
      return next(
        new ForbiddenError("You do not have permission to access this resource")
      );
    }

    next();
  };
};

// Middleware to check if the user has all allowed roles
export const requireAllRoles = (requiredRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const hasAllRoles = requiredRoles.every((role) =>
      req.user!.roles.includes(role)
    );
    if (!hasAllRoles) {
      return next(new ForbiddenError("All required roles needed"));
    }

    next();
  };
};
