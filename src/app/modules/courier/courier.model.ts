import mongoose, { Schema, model } from "mongoose";
import { TCourier } from "./courier.interface";

const CourierSchema = new Schema<TCourier>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    thumb: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
    },
    credentials: {
      type: [
        {
          key: { type: String },
          value: { type: String },
          need_to_hash: { type: Boolean },
          is_optional: { type: Boolean },
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Courier = model<TCourier>("Courier", CourierSchema);
