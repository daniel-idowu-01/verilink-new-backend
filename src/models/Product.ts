import { IProduct } from "./interfaces/IProduct";
import { Document, Schema, model } from "mongoose";

export interface PaginatedProductsResult {
  products: IProduct[];
  total: number;
  categories: string[];
}

export interface ProductCategory {
  name: string;
  itemCount: number;
  icon?: string;
}

const productSchema = new Schema<IProduct>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String, required: true, unique: true },
    barcodeType: { type: String, enum: ["QR", "EAN"], default: "EAN" },
    category: {
      type: String,
      required: true,
    },
    subcategory: { type: String },
    imageUrl: { type: String, required: true },
    stockQuantity: { type: Number, default: 0 },
    expiryDate: { type: Date },
    weight: { type: Number },
    requiresTag: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },

    // Order tracking
    orderCount: { type: Number, default: 0 },
    lastOrdered: { type: Date },

    // Pricing options
    variants: [
      {
        name: { type: String }, // e.g., "Small", "Medium", "Large"
        price: { type: Number },
        sku: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
productSchema.index({ vendorId: 1, category: 1 });
productSchema.index({ vendorId: 1, isAvailable: 1 });
productSchema.index({ name: "text", description: "text" });

// Virtual for formatted price
productSchema.virtual("formattedPrice").get(function () {
  return `$${this.price.toFixed(2)}`;
});

export const Product = model<IProduct>("Product", productSchema);
