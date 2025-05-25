import { IProduct } from "./IProduct";
import { Document, Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId | IProduct;
  quantity: number;
  priceAtAddition: number;
  addedAt?: Date;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt?: Date;
  updatedAt?: Date;
}
