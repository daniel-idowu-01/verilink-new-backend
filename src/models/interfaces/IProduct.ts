import { Document, Schema, Types } from "mongoose";

export interface IProduct extends Document {
  vendorId: Types.ObjectId;
  productId: string;
  name: string;
  description?: string;
  price: number;
  sku: string;
  barcode: string;
  barcodeType: "QR" | "EAN";
  category?: string;
  subcategory?: string;
  imageUrl?: string;
  orderCount: number;
  stockQuantity: number;
  lastOrdered?: Date;
  expiryDate?: Date;
  weight?: number;
  isAvailable: boolean;
  requiresTag: boolean;
  variants?: {
    name: string;
    price: number;
    sku: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
