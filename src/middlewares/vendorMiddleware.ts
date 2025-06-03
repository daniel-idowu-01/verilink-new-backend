import { UserRole } from "../models/interfaces/IUser";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { AuthenticatedRequest } from "../controllers/AnalyticsController";

export const validateVendorAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    const { roles, vendorId } = req.user;

    // Check if user has vendor role or is an admin/manager
    const hasVendorAccess =
      roles.includes(UserRole.VENDOR) ||
      roles.includes(UserRole.ADMIN) ||
      roles.includes(UserRole.MANAGER);

    if (!hasVendorAccess) {
      throw new ForbiddenError("Access denied. Vendor access required.");
    }

    // Ensure vendorId is present for vendor-specific routes
    if (roles.includes(UserRole.VENDOR) && !vendorId) {
      throw new ForbiddenError("Vendor ID is required for vendor access");
    }

    // Attach vendorId to request for further processing
    req.user.vendorId = vendorId || req.user.id;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error);
    }
    console.error("Vendor access validation error:", error);
    next(new ForbiddenError("Internal server error"));
  }
};
