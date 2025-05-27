import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { UserService } from "../services";
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
    const accessToken =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!accessToken) {
      throw new UnauthorizedError("Access token required");
    }

    const decoded = jwt.verify(accessToken, config.JWT_SECRET) as {
      id: string;
      email: string;
      roles: UserRole[];
    };

    req.user = decoded as {
      id: string;
      email: string;
      roles: UserRole[];
      vendorId?: string;
      status: UserStatus;
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token expired - please refresh"));
    } else {
      next();
    }
  }
};

export const refreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required");
    }

    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as {
      id: string;
    };
    const user = await UserService.getUserById(decoded.id);

    if (!user) throw new UnauthorizedError("User not found");

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
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
