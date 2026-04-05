import { Schema, model } from "mongoose";
import { TBookPreview } from "./bookPreview.interface";

const bookPreviewSchema = new Schema<TBookPreview>(
  {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const BookPreviewModel = model<TBookPreview>(
  "BookPreview",
  bookPreviewSchema
);
