import { Schema, model } from "mongoose";
import { TImage } from "./image.interface";

const imageSchema = new Schema<TImage>(
  {
    src: { type: String, required: true },
    alt: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, required: true },
    purpose: {
      type: String,
      enum: ["product", "blog", "general"],
      default: "general",
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ImageModel = model<TImage>("Image", imageSchema);
