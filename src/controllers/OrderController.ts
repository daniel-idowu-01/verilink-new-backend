import logger from "../utils/logger";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { ApiResponse } from "../middlewares/responseHandler";
import { IOrder, IOrderItem } from "../models/interfaces/IOrder";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { Request, Response, NextFunction, RequestHandler } from "express";

export class OrderController {
  ////////////////////////////////////
  // Create new order
  ////////////////////////////////////
  createOrder: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vendorId = req.user?.vendorId;
      const userId = req.user?.id;

      if (!vendorId) {
        throw new BadRequestError("Vendor ID required");
      }

      const {
        items, // array of order items e.g [{ productId, quantity, variant }]
        tableNumber,
        customerName,
        customerPhone,
        customerEmail,
        specialRequests,
        discountAmount = 0,
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new BadRequestError("Order items are required");
      }

      // Validate and calculate order totals
      let subtotal = 0;
      const validatedItems: IOrderItem[] = [];

      for (const item of items) {
        const product = await Product.findOne({
          _id: item.productId,
          vendorId,
          isAvailable: true,
        });

        if (!product) {
          throw new BadRequestError(
            `Product ${item.productId} not found or unavailable`
          );
        }

        // Use variant price if specified, otherwise use base price
        const price =
          item.variant && product.variants?.length
            ? product.variants.find((v) => v.name === item.variant)?.price ||
              product.price
            : product.price;

        const itemSubtotal = price * item.quantity;
        subtotal += itemSubtotal;

        validatedItems.push({
          productId: item.productId,
          priceAtOrder: price,
          quantity: item.quantity,
          variant: item.variant,
          totalPrice: itemSubtotal,
        });
      }

      // Calculate tax (assuming 10% tax rate)
      const taxRate = 0.1;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount - discountAmount;

      // Create order
      const order = new Order({
        vendorId,
        tableNumber,
        items: validatedItems,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        customerName,
        customerPhone,
        customerEmail,
        specialRequests,
        takenBy: userId,
        status: "pending",
      });

      await order.save();

      // Update product order counts
      await Promise.all(
        validatedItems.map((item) =>
          Product.findByIdAndUpdate(item.productId, {
            $inc: { orderCount: item.quantity },
            lastOrdered: new Date(),
          })
        )
      );

      logger.info(`Order created: ${order.orderNumber} by user: ${userId}`);

      ApiResponse.created(res, { order }, "Order created successfully");
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Get orders with filtering
  ////////////////////////////////////
  getOrders: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        throw new BadRequestError("Vendor ID required");
      }

      const {
        status,
        dineOption,
        date,
        page = 1,
        limit = 20,
        sortBy = "orderTime",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query: any = { vendorId };

      if (status) {
        query.status = status;
      }

      if (date) {
        const startDate = new Date(date as string);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        query.orderTime = {
          $gte: startDate,
          $lt: endDate,
        };
      }

      // Execute query with pagination
      const skip = (Number(page) - 1) * Number(limit);
      const sortOption: any = {};
      sortOption[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate("items.productId", "name imageUrl")
          .sort(sortOption)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Order.countDocuments(query),
      ]);

      ApiResponse.success(
        res,
        {
          orders,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            itemsPerPage: Number(limit),
          },
          filters: { status, dineOption, date },
        },
        "Orders retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Get single order
  ////////////////////////////////////
  getOrderById: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const vendorId = req.user?.vendorId;

      const order = await Order.findOne({ _id: id, vendorId })
        .populate("items.productId", "name imageUrl category")
        .populate("takenBy", "firstName lastName email")
        .populate("servedBy", "firstName lastName email")
        .lean();

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      ApiResponse.success(res, { order }, "Order retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Update order status
  ////////////////////////////////////
  updateOrderStatus: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const vendorId = req.user?.vendorId;
      const userId = req.user?.id;

      const validStatuses = [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        throw new BadRequestError("Invalid order status");
      }

      const updateData: any = { status };

      // Set completion time and served by for final statuses
      if (status === "completed" || status === "served") {
        updateData.completedTime = new Date();
        updateData.servedBy = userId;
      }

      // Set estimated ready time when confirmed
      if (status === "confirmed") {
        const estimatedTime = new Date();
        estimatedTime.setMinutes(estimatedTime.getMinutes() + 15); // Default 15 min prep time
        updateData.estimatedReadyTime = estimatedTime;
      }

      const order = await Order.findOneAndUpdate(
        { _id: id, vendorId },
        updateData,
        { new: true }
      ).populate("items.productId", "name");

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      logger.info(
        `Order status updated: ${order.orderNumber} to ${status} by user: ${userId}`
      );

      ApiResponse.success(res, { order }, `Order ${status} successfully`);
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Update payment status
  ////////////////////////////////////
  updatePaymentStatus: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentMethod, paymentReference } = req.body;
      const vendorId = req.user?.vendorId;

      const validPaymentStatuses = ["pending", "paid", "refunded"];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        throw new BadRequestError("Invalid payment status");
      }

      const order = await Order.findOneAndUpdate(
        { _id: id, vendorId },
        { paymentStatus, paymentMethod, paymentReference },
        { new: true }
      );

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      logger.info(
        `Payment status updated: ${order.orderNumber} to ${paymentStatus}`
      );

      ApiResponse.success(
        res,
        { order },
        "Payment status updated successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Get order statistics
  ////////////////////////////////////
  getOrderStats: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        throw new BadRequestError("Vendor ID required");
      }

      const { period = "today" } = req.query;

      let dateFilter: any = {};
      const now = new Date();

      switch (period) {
        case "today":
          dateFilter = {
            orderTime: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              $lt: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1
              ),
            },
          };
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { orderTime: { $gte: weekAgo } };
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = { orderTime: { $gte: monthAgo } };
          break;
      }

      const stats = await Order.aggregate([
        {
          $match: {
            vendorId: vendorId,
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            averageOrderValue: { $avg: "$totalAmount" },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            completedOrders: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
      ]);

      const result = stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        completedOrders: 0,
      };

      // Get top selling products
      const topProducts = await Order.aggregate([
        { $match: { vendorId: vendorId, ...dateFilter } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: "$items.subtotal" },
            productName: { $first: "$items.name" },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
      ]);

      ApiResponse.success(
        res,
        {
          ...result,
          topProducts,
          period,
        },
        "Order statistics retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Cancel order
  ////////////////////////////////////
  cancelOrder: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const vendorId = req.user?.vendorId;
      const userId = req.user?.id;

      if (!reason) {
        throw new BadRequestError("Cancellation reason is required");
      }

      const order = await Order.findOneAndUpdate(
        { _id: id, vendorId, status: { $ne: "completed" } },
        {
          status: "cancelled",
          cancelledBy: userId,
          cancellationReason: reason,
        },
        { new: true }
      );

      if (!order) {
        throw new NotFoundError("Order not found or cannot be cancelled");
      }

      logger.info(`Order cancelled: ${order.orderNumber} by user: ${userId}`);
      ApiResponse.success(res, { order }, "Order cancelled successfully");
    } catch (error) {
      next(error);
    }
  };
}
