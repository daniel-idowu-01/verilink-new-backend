import { Schema, model } from "mongoose";
import {
  ITransaction,
  ITransactionItem,
  PaymentMethod,
  TransactionStatus,
} from "./interfaces/ITransaction";

const transactionItemSchema = new Schema<ITransactionItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const transactionSchema = new Schema<ITransaction>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [transactionItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    exitToken: { type: String, unique: true },
    exitTokenExpiry: { type: Date },
    exitVerified: { type: Boolean, default: false },
    verificationMethod: {
      type: String,
      enum: ["gate", "manual", "weight"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual population
transactionSchema.virtual("customer", {
  ref: "User",
  localField: "customerId",
  foreignField: "_id",
  justOne: true,
});

transactionSchema.virtual("vendor", {
  ref: "User",
  localField: "vendorId",
  foreignField: "_id",
  justOne: true,
});

// Indexes for better query performance
transactionSchema.index({ customerId: 1 });
transactionSchema.index({ vendorId: 1 });
// transactionSchema.index({ exitToken: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ paymentStatus: 1 });

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema
);
