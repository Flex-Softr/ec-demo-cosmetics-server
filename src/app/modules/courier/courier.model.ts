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
    image: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Image",
    },
    // website: {
    //   type: String,
    // },
    apiBaseUrl: {
      type: String,
    },
    apiKey: {
      type: String,
    },
    secretKey: {
      type: String,
    },
    credentials: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

export const Courier = model<TCourier>("Courier", CourierSchema);
