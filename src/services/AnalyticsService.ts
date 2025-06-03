import mongoose from "mongoose";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { User } from "../models/User";
import {
  ISalesMetrics,
  IProductAnalytics,
  IOrderAnalytics,
  IDashboardReport,
  IReportQuery,
} from "../models/interfaces/IAnalytics";
import { OrderStatus } from "../models/interfaces/IOrder";

interface ICustomerPopulated {
  _id: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export class AnalyticsService {
  ////////////////////////////////////
  // Get comprehensive dashboard report for vendor
  ////////////////////////////////////
  static async getDashboardReport(
    vendorId: string,
    period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    page: number = 1,
    limit: number = 10
  ): Promise<IDashboardReport> {
    const dateRange = this.getDateRange(period);
    const previousDateRange = this.getPreviousDateRange(period);

    const [
      currentMetrics,
      previousMetrics,
      salesGraph,
      favoriteProducts,
      recentOrders,
      totalOrdersCount,
    ] = await Promise.all([
      this.getSalesMetrics(vendorId, dateRange.start, dateRange.end),
      this.getSalesMetrics(
        vendorId,
        previousDateRange.start,
        previousDateRange.end
      ),
      this.getSalesGraphData(vendorId, dateRange.start, dateRange.end, period),
      this.getFavoriteProducts(vendorId, dateRange.start, dateRange.end),
      this.getRecentOrders(vendorId, page, limit),
      this.getTotalOrdersCount(vendorId),
    ]);

    // Calculate growth percentages
    const metrics: ISalesMetrics = {
      ...currentMetrics,
      growthPercentage: this.calculateGrowthPercentage(
        currentMetrics.totalSalesAmount,
        previousMetrics.totalSalesAmount
      ),
      previousPeriodAmount: previousMetrics.totalSalesAmount,
    };

    return {
      metrics,
      salesGraph,
      favoriteProducts,
      recentOrders: recentOrders.orders,
      totalPages: Math.ceil(totalOrdersCount / limit),
      currentPage: page,
    };
  }

  ////////////////////////////////////
  // Get sales metrics for a specific period
  ////////////////////////////////////
  private static async getSalesMetrics(
    vendorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Omit<ISalesMetrics, "growthPercentage" | "previousPeriodAmount">> {
    const salesAggregation = await Order.aggregate([
      {
        $match: {
          vendorId: vendorId,
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: [OrderStatus.DELIVERED, OrderStatus.CONFIRMED] },
        },
      },
      {
        $group: {
          _id: null,
          totalSalesAmount: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $size: "$items" } },
          uniqueCustomers: { $addToSet: "$customerId" },
        },
      },
    ]);

    const salesData = salesAggregation[0] || {
      totalSalesAmount: 0,
      totalOrders: 0,
      totalItems: 0,
      uniqueCustomers: [],
    };

    // Calculate net profit (assuming 30% profit margin for demo)
    const netProfit = salesData.totalSalesAmount * 0.3;

    return {
      totalSalesAmount: salesData.totalSalesAmount,
      totalProductSales: salesData.totalItems,
      totalCustomers: salesData.uniqueCustomers.length,
      netProfit: netProfit,
    };
  }

  ////////////////////////////////////
  // Get sales graph data points
  ////////////////////////////////////
  private static async getSalesGraphData(
    vendorId: string,
    startDate: Date,
    endDate: Date,
    period: "daily" | "weekly" | "monthly" | "yearly"
  ) {
    const groupFormat = this.getGroupFormat(period);

    const graphData = await Order.aggregate([
      {
        $match: {
          vendorId: vendorId,
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: [OrderStatus.DELIVERED, OrderStatus.CONFIRMED] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: "$createdAt",
            },
          },
          amount: { $sum: "$total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return graphData.map((item) => ({
      date: item._id,
      amount: item.amount,
    }));
  }

  ////////////////////////////////////
  // Get top performing products
  ////////////////////////////////////
  private static async getFavoriteProducts(
    vendorId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 5
  ): Promise<IProductAnalytics[]> {
    const productAnalytics = await Order.aggregate([
      {
        $match: {
          vendorId: vendorId,
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: [OrderStatus.DELIVERED, OrderStatus.CONFIRMED] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalOrders: { $sum: 1 },
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          productId: "$_id",
          productName: "$product.name",
          imageUrl: "$product.imageUrl",
          totalOrders: 1,
          totalQuantitySold: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ]);

    return productAnalytics;
  }

  ////////////////////////////////////
  // Get recent orders with pagination
  ////////////////////////////////////
  private static async getRecentOrders(
    vendorId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    const orders = await Order.find({ vendorId })
      .populate<{ customerId: ICustomerPopulated }>(
        "customerId",
        "firstName lastName email"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedOrders: IOrderAnalytics[] = orders.map((order) => ({
      orderId: order.orderNumber,
      dateTime: order.createdAt,
      customerName:
        `${order.customerId.firstName || ""} ${
          order.customerId.lastName || ""
        }`.trim() || "Unknown",
      orderStatus: order.status as any,
      totalPayment: order.total,
      paymentMethod: order.paymentMethod,
      orderItems: order.items.length,
    }));

    return { orders: formattedOrders };
  }

  ////////////////////////////////////
  // Get total orders count for pagination
  ////////////////////////////////////
  private static async getTotalOrdersCount(vendorId: string): Promise<number> {
    return await Order.countDocuments({ vendorId });
  }

  ////////////////////////////////////
  // Get date range based on period
  ////////////////////////////////////
  private static getDateRange(
    period: "daily" | "weekly" | "monthly" | "yearly"
  ) {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case "daily":
        start.setDate(now.getDate() - 30); // Last 30 days
        break;
      case "weekly":
        start.setDate(now.getDate() - 7 * 12); // Last 12 weeks
        break;
      case "monthly":
        start.setMonth(now.getMonth() - 12); // Last 12 months
        break;
      case "yearly":
        start.setFullYear(now.getFullYear() - 5); // Last 5 years
        break;
    }

    return { start, end: now };
  }

  ////////////////////////////////////
  // Get previous period date range for comparison
  ////////////////////////////////////
  private static getPreviousDateRange(
    period: "daily" | "weekly" | "monthly" | "yearly"
  ) {
    const current = this.getDateRange(period);
    const duration = current.end.getTime() - current.start.getTime();

    return {
      start: new Date(current.start.getTime() - duration),
      end: new Date(current.start.getTime()),
    };
  }

  ////////////////////////////////////
  // Get MongoDB date grouping format
  ////////////////////////////////////
  private static getGroupFormat(
    period: "daily" | "weekly" | "monthly" | "yearly"
  ): string {
    switch (period) {
      case "daily":
        return "%Y-%m-%d";
      case "weekly":
        return "%Y-W%U";
      case "monthly":
        return "%Y-%m";
      case "yearly":
        return "%Y";
      default:
        return "%Y-%m-%d";
    }
  }

  ////////////////////////////////////
  // Calculate growth percentage
  ////////////////////////////////////
  private static calculateGrowthPercentage(
    current: number,
    previous: number
  ): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  ////////////////////////////////////
  // Get filtered orders with search and date range
  ////////////////////////////////////
  static async getFilteredOrders(
    vendorId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      customerName?: string;
      orderStatus?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const {
      startDate,
      endDate,
      customerName,
      orderStatus,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;
    const matchQuery: any = { vendorId };

    // Date range filter
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = startDate;
      if (endDate) matchQuery.createdAt.$lte = endDate;
    }

    // Status filter
    if (orderStatus && orderStatus !== "all") {
      matchQuery.status = orderStatus;
    }

    let pipeline: any[] = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
    ];

    // Customer name filter
    if (customerName) {
      pipeline.push({
        $match: {
          $or: [
            { "customer.firstName": { $regex: customerName, $options: "i" } },
            { "customer.lastName": { $regex: customerName, $options: "i" } },
            { "customer.email": { $regex: customerName, $options: "i" } },
          ],
        },
      });
    }

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await Order.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    // Add pagination and sorting
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          orderNumber: 1,
          createdAt: 1,
          status: 1,
          total: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          customerName: {
            $concat: ["$customer.firstName", " ", "$customer.lastName"],
          },
          customerEmail: "$customer.email",
          itemCount: { $size: "$items" },
        },
      }
    );

    const orders = await Order.aggregate(pipeline);

    return {
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }
}
