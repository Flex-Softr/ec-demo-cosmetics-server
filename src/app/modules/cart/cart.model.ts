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
    expireAt: {
      type: Date,
      // No default — set explicitly at creation time based on guest vs user
    },
  },
  {
    timestamps: true,
  }
);

/**
 * TTL Index: MongoDB automatically deletes the document when `expireAt` is reached.
 * - Guest carts: expireAt = now + 7 days
 * - User carts:  expireAt = now + 90 days (reset on every cart update)
 * expireAfterSeconds: 0 means "delete exactly at expireAt" (no additional delay).
 * sparse: true means documents without expireAt are ignored by the index.
 */
CartSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const Cart = model<TCart>("Cart", CartSchema);
