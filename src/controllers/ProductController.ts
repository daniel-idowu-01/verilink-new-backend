import { Request, Response, NextFunction, RequestHandler } from "express";
import { Product, ProductCategory } from "../models/Product";
import { ApiResponse } from "../middlewares/responseHandler";
import { BadRequestError, NotFoundError } from "../utils/errors";
import logger from "../utils/logger";

export class ProductController {
  ////////////////////////////////////
  // Get all products with category filtering and search
  ////////////////////////////////////
  getProducts: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        category = "All Products",
        search,
        page = 1,
        limit = 20,
        sortBy = "name",
        sortOrder = "asc",
        available = true,
      } = req.query;

      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        throw new BadRequestError("Vendor ID required");
      }

      // Build query
      const query: any = {
        vendorId,
        isAvailable: available === true,
      };

      if (category !== "All Products") {
        query.category = category;
      }

      if (search) {
        query.$text = { $search: search as string };
      }

      // Execute query with pagination
      const skip = (Number(page) - 1) * Number(limit);
      const sortOption: any = {};
      sortOption[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      const [products, total] = await Promise.all([
        Product.find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Product.countDocuments(query),
      ]);

      // Get category counts
      const categoryStats = await Product.aggregate([
        {
          $match: {
            vendorId: vendorId,
            isAvailable: true,
          },
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]);

      const categories: ProductCategory[] = [
        { name: "All Products", itemCount: total },
        ...categoryStats.map((stat) => ({
          name: stat._id,
          itemCount: stat.count,
        })),
      ];

      ApiResponse.success(
        res,
        {
          products,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            itemsPerPage: Number(limit),
          },
          categories,
          filters: {
            category,
            search,
            available,
          },
        },
        "Products retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Get product by ID
  ////////////////////////////////////
  getProductById: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const vendorId = req.user?.vendorId;

      const product = await Product.findOne({
        _id: id,
        vendorId,
      }).lean();

      if (!product) {
        throw new NotFoundError("Product not found");
      }

      ApiResponse.success(res, { product }, "Product retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Create new product
  ////////////////////////////////////
  createProduct: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        throw new BadRequestError("Vendor ID required");
      }

      const productData = {
        ...req.body,
        vendorId,
      };

      const product = new Product(productData);
      await product.save();

      logger.info(`Product created: ${product._id} by vendor: ${vendorId}`);

      ApiResponse.created(res, { product }, "Product created successfully");
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Update product
  ////////////////////////////////////
  updateProduct: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const vendorId = req.user?.vendorId;

      const product = await Product.findOneAndUpdate(
        { _id: id, vendorId },
        req.body,
        { new: true, runValidators: true }
      );

      if (!product) {
        throw new NotFoundError("Product not found");
      }

      logger.info(`Product updated: ${product._id} by vendor: ${vendorId}`);

      ApiResponse.success(res, { product }, "Product updated successfully");
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Delete product
  ////////////////////////////////////
  deleteProduct: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const vendorId = req.user?.vendorId;

      const product = await Product.findOneAndDelete({ _id: id, vendorId });

      if (!product) {
        throw new NotFoundError("Product not found");
      }

      logger.info(`Product deleted: ${product._id} by vendor: ${vendorId}`);

      ApiResponse.success(res, null, "Product deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Toggle product availability
  ////////////////////////////////////
  toggleAvailability: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const vendorId = req.user?.vendorId;

      const product = await Product.findOne({ _id: id, vendorId });

      if (!product) {
        throw new NotFoundError("Product not found");
      }

      product.isAvailable = !product.isAvailable;
      await product.save();

      logger.info(
        `Product availability toggled: ${product._id} - ${product.isAvailable}`
      );

      ApiResponse.success(
        res,
        {
          product: {
            id: product._id,
            name: product.name,
            isAvailable: product.isAvailable,
          },
        },
        `Product ${product.isAvailable ? "enabled" : "disabled"} successfully`
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Get product categories with counts
  ////////////////////////////////////
  getCategories: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        throw new BadRequestError("Vendor ID required");
      }

      const categoryStats = await Product.aggregate([
        {
          $match: {
            vendorId: vendorId,
            isAvailable: true,
          },
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            products: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            name: "$_id",
            itemCount: "$count",
            sampleProducts: { $slice: ["$products", 3] },
          },
        },
      ]);

      const totalProducts = await Product.countDocuments({
        vendorId,
        isAvailable: true,
      });

      const categories: ProductCategory[] = [
        { name: "All Menu", itemCount: totalProducts },
        ...categoryStats,
      ];

      ApiResponse.success(
        res,
        { categories },
        "Categories retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // Bulk update products
  ////////////////////////////////////
  bulkUpdateProducts: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { updates } = req.body; // Array of { id, updateData }
      const vendorId = req.user?.vendorId;

      if (!Array.isArray(updates)) {
        throw new BadRequestError("Updates must be an array");
      }

      const results = await Promise.all(
        updates.map(async ({ id, updateData }) => {
          try {
            const product = await Product.findOneAndUpdate(
              { _id: id, vendorId },
              updateData,
              { new: true, runValidators: true }
            );
            return { id, success: !!product, product };
          } catch (error: any) {
            return { id, success: false, error: error.message };
          }
        })
      );

      const successful = results.filter((r) => r.success).length;
      const failed = results.length - successful;

      logger.info(
        `Bulk update completed: ${successful} successful, ${failed} failed`
      );

      ApiResponse.success(
        res,
        {
          results,
          summary: { successful, failed, total: results.length },
        },
        "Bulk update completed"
      );
    } catch (error) {
      next(error);
    }
  };
}
