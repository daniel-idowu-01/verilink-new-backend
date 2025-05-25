import { Schema, model } from "mongoose";
import { ICart } from "./interfaces/ICart";

const cartItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtAddition: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
});

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export const Cart = model<ICart>("Cart", cartSchema);
