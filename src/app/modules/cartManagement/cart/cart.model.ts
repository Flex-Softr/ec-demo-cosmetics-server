import mongoose, { Schema, model } from "mongoose";
import { TCart } from "./cart.interface";

const CartSchema = new Schema<TCart>(
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

export const Cart = model<TCart>("Cart", CartSchema);
