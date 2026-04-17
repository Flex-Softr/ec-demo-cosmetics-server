import mongoose, { Schema, model } from "mongoose";
import { TAddress } from "../../../types/address";

const AddressSchema = new Schema<TAddress>(
  {
    uid: {
      type: String,
      required: true,
      immutable: true,
      unique: true,
    },
    sessionId: {
      type: String,
    },
    fullAddress: {
      type: String,
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
    division: {
      type: String,
    },
    district: {
      type: String,
    },
    upazila: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Address = model<TAddress>("Address", AddressSchema);
