import mongoose, { Schema, model } from "mongoose";
import { TCartItem } from "./cartItem.interface";

const CartItemSchema = new Schema<TCartItem>(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
    },
    sessionId: {
      type: String,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      immutable: true,
      ref: "Product",
    },
    variation: {
      type: mongoose.Schema.ObjectId,
      ref: "Variation",
    },
    quantity: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const CartItem = model<TCartItem>("CartItem", CartItemSchema);
