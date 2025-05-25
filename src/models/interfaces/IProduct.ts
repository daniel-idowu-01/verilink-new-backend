import { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  vendorId: string;
  productId: string;
  name: string;
  description?: string;
  price: number;
  sku: string;
  barcode: string;
  barcodeType: "QR" | "EAN";
  category?: string;
  imageUrl?: string;
  stockQuantity: number;
  expiryDate?: Date;
  weight?: number;
  requiresTag: boolean;
  createdAt: Date;
  updatedAt: Date;
}