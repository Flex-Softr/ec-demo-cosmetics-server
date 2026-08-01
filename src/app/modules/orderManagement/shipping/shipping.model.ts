import { Schema, model } from "mongoose";
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
    email: {
      type: String,
    },
    fullAddress: {
      type: String,
      required: true,
    },
    upazila: {
      type: String,
      // ref: "Division",
    },
    district: {
      type: String,
      // ref: "District",
    },
    division: {
      type: String,
      // ref: "Division",
    },
    // city: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "City",
    // },
    // state: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "State",
    // },
    // country: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Country",
    // },
  },
  { timestamps: true }
);

ShippingSchema.index({ phoneNumber: 1 });
ShippingSchema.index({ email: 1 });
ShippingSchema.index({ division: 1, district: 1, upazila: 1 });
ShippingSchema.index({ fullName: 1 });

export const Shipping = model<TShippingData>("Shipping", ShippingSchema);
