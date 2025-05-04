import mongoose, { Schema, model } from "mongoose";
import { TShippingData } from "./shipping.interface";

export const ShippingSchema = new Schema<TShippingData>(
  {
    orderId: {
      type: String,
    },
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    fullAddress: {
      type: String,
      required: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
    },
    district: {
      type: String,
      // ref: "District",
    },
    division: {
      type: String,
      // ref: "Division",
    },
    upazila: {
      type: String,
      // ref: "Division",
    },
  },
  { timestamps: true }
);

export const Shipping = model<TShippingData>("Shipping", ShippingSchema);
