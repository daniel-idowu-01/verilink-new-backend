import { Response } from "express";

/**
 * Standardized success response format
 */
export class ApiResponse {
  static success(
    res: Response,
    data: any,
    message: string = "Success",
    statusCode: number = 200
  ) {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(
    res: Response,
    data: any,
    message: string = "Resource created"
  ) {
    res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static noContent(res: Response, message: string = "No content") {
    res.status(204).json({
      success: true,
      message,
    });
  }
}

/**
 * Standardized paginated response format
 */
export class PaginatedResponse {
  static send(
    res: Response,
    data: any,
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    },
    message: string = "Success"
  ) {
    res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: pagination.totalPages,
      },
    });
  }
}
