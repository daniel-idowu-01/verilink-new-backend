import { IProduct } from "./interfaces/IProduct";
import { Document, Schema, model } from "mongoose";

export interface PaginatedProductsResult {
  products: IProduct[];
  total: number;
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
    category: { type: String },
    imageUrl: { type: String },
    stockQuantity: { type: Number, default: 0 },
    expiryDate: { type: Date },
    weight: { type: Number },
    requiresTag: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Product = model<IProduct>("Product", productSchema);
