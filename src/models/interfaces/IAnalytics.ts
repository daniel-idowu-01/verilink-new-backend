import { Document, Types } from "mongoose";

export interface ISalesMetrics {
  totalSalesAmount: number;
  totalProductSales: number;
  totalCustomers: number;
  netProfit: number;
  growthPercentage: number;
  previousPeriodAmount: number;
}

export interface IProductAnalytics {
  productId: Types.ObjectId;
  productName: string;
  imageUrl?: string;
  totalOrders: number;
  totalRevenue: number;
  totalQuantitySold: number;
}

export interface IOrderAnalytics {
  orderId: string;
  dateTime: Date;
  customerName: string;
  orderStatus: "pending" | "completed" | "cancelled" | "refunded";
  totalPayment: number;
  paymentMethod: string;
  orderItems: number;
}

export interface IReportQuery {
  vendorId: string;
  startDate: Date;
  endDate: Date;
  period: "daily" | "weekly" | "monthly" | "yearly";
}

export interface IDashboardReport {
  metrics: ISalesMetrics;
  salesGraph: Array<{
    date: string;
    amount: number;
  }>;
  favoriteProducts: IProductAnalytics[];
  recentOrders: IOrderAnalytics[];
  totalPages: number;
  currentPage: number;
}
