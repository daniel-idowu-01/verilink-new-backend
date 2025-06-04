import { Document, Types } from "mongoose";
import { IUser } from "./IUser";
import { IProduct } from "./IProduct";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export interface IOrderItem {
  productId: Types.ObjectId | IProduct;
  quantity: number;
  variant: string;
  priceAtOrder: number;
  totalPrice: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId: Types.ObjectId | IUser;
  vendorId: Types.ObjectId | IUser;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentReference: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderNotes?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}
