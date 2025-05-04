import { Document, model, Schema } from "mongoose";
import { TUpazila } from "./upazila.types";

const UpazilaSchema = new Schema<TUpazila & Document>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
    },
    bn_name: {
      type: String,
      required: true,
    },
    district_id: {
      type: String,
      ref: "districts",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Upazila = model<TUpazila & Document>("upazilas", UpazilaSchema);
