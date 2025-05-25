import { IUser } from "./IUser";
import { IProduct } from "./IProduct";
import { Document, Types } from "mongoose";

export enum PaymentMethod {
  CARD = "card",
  CASH = "cash",
  TRANSFER = "transfer",
  WALLET = "wallet",
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface ITransactionItem {
  productId: Types.ObjectId | IProduct;
  quantity: number;
  priceAtPurchase: number;
}

export interface ITransaction extends Document {
  customerId: Types.ObjectId | IUser;
  vendorId: Types.ObjectId | IUser;
  items: ITransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: TransactionStatus;
  exitToken?: string;
  exitTokenExpiry?: Date;
  exitVerified: boolean;
  verificationMethod?: "gate" | "manual" | "weight";
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  readonly customer?: IUser;
  readonly vendor?: IUser;
}
