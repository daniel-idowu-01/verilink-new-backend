import logger from "../utils/logger";
import { ApiResponse } from "../middlewares/responseHandler";
import { AnalyticsService } from "../services/AnalyticsService";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { UserRole, UserStatus } from "../models/interfaces/IUser";
import { Request, Response, NextFunction, RequestHandler } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    vendorId?: string;
    roles: UserRole[];
    status: UserStatus;
  };
}

export class AnalyticsController {
  ////////////////////////////////////
  // Get vendor dashboard report
  ////////////////////////////////////
  getDashboardReport: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { period = "monthly", page = "1", limit = "10" } = req.query;
      const vendorId = req.user?.vendorId || req.user?.id;

      if (!vendorId) {
        throw new BadRequestError("Vendor ID is required");
      }

      // Validate period
      const validPeriods = ["daily", "weekly", "monthly", "yearly"];
      if (!validPeriods.includes(period as string)) {
        throw new BadRequestError(
          "Invalid period. Must be one of: daily, weekly, monthly, yearly"
        );
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw new BadRequestError("Invalid pagination parameters");
      }

      logger.info(
        `Generating dashboard report for vendor: ${vendorId}, period: ${period}`
      );

      const report = await AnalyticsService.getDashboardReport(
        vendorId,
        period as "daily" | "weekly" | "monthly" | "yearly",
        pageNum,
        limitNum
      );

      ApiResponse.success(
        res,
        report,
        "Dashboard report generated successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Get filtered orders with search and pagination
  ////////////////////////////////////
  getFilteredOrders: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        startDate,
        endDate,
        customerName,
        orderStatus,
        page = "1",
        limit = "10",
      } = req.query;

      const vendorId = req.user?.vendorId || req.user?.id;

      if (!vendorId) {
        throw new BadRequestError("Vendor ID is required");
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw new BadRequestError("Invalid pagination parameters");
      }

      const filters: any = {
        page: pageNum,
        limit: limitNum,
      };

      // Parse dates if provided
      if (startDate) {
        const parsedStartDate = new Date(startDate as string);
        if (isNaN(parsedStartDate.getTime())) {
          throw new BadRequestError("Invalid start date format");
        }
        filters.startDate = parsedStartDate;
      }

      if (endDate) {
        const parsedEndDate = new Date(endDate as string);
        if (isNaN(parsedEndDate.getTime())) {
          throw new BadRequestError("Invalid end date format");
        }
        filters.endDate = parsedEndDate;
      }

      if (customerName) {
        filters.customerName = customerName as string;
      }

      if (orderStatus) {
        filters.orderStatus = orderStatus as string;
      }

      logger.info(`Fetching filtered orders for vendor: ${vendorId}`);

      const result = await AnalyticsService.getFilteredOrders(
        vendorId,
        filters
      );

      ApiResponse.success(res, result, "Orders retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Get sales summary for specific date range
  ////////////////////////////////////
  getSalesSummary: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, groupBy = "day" } = req.query;
      const vendorId = req.user?.vendorId || req.user?.id;

      if (!vendorId) {
        throw new BadRequestError("Vendor ID is required");
      }

      if (!startDate || !endDate) {
        throw new BadRequestError("Start date and end date are required");
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestError("Invalid date format");
      }

      if (start >= end) {
        throw new BadRequestError("Start date must be before end date");
      }

      const validGroupBy = ["day", "week", "month"];
      if (!validGroupBy.includes(groupBy as string)) {
        throw new BadRequestError(
          "Invalid groupBy. Must be one of: day, week, month"
        );
      }

      // This would require additional implementation in AnalyticsService
      // For now, returning a placeholder response
      ApiResponse.success(
        res,
        {
          summary: "Sales summary functionality to be implemented",
          period: { startDate: start, endDate: end },
          groupBy,
        },
        "Sales summary retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Export report data (placeholder for CSV/PDF export)
  ////////////////////////////////////
  exportReport: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { format = "csv", period = "monthly" } = req.query;
      const vendorId = req.user?.vendorId || req.user?.id;

      if (!vendorId) {
        throw new BadRequestError("Vendor ID is required");
      }

      const validFormats = ["csv", "pdf", "xlsx"];
      if (!validFormats.includes(format as string)) {
        throw new BadRequestError(
          "Invalid format. Must be one of: csv, pdf, xlsx"
        );
      }

      logger.info(
        `Exporting report for vendor: ${vendorId}, format: ${format}`
      );

      // Get the dashboard data
      const report = await AnalyticsService.getDashboardReport(
        vendorId,
        period as "daily" | "weekly" | "monthly" | "yearly"
      );

      // For now, just return the data
      // In a real implementation, you'd generate the actual file
      ApiResponse.success(
        res,
        {
          message: `Report export in ${format} format to be implemented`,
          data: report,
          downloadUrl: `/api/reports/download/${vendorId}/${format}`,
        },
        "Report export initiated successfully"
      );
    } catch (error) {
      next(error);
    }
  };
}
