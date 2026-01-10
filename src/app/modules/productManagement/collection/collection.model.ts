import httpStatus from "http-status";
import { Schema, model } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { ImageModel } from "../../image/image.model";
import { TCollection } from "./collection.interface";

const collectionSchema = new Schema<TCollection>(
  {
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    image: { type: Schema.Types.ObjectId, ref: "Image" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

collectionSchema.pre("save", async function (next) {
  if (this.image) {
    const isImageExist = await ImageModel.findById(this.image);
    if (!isImageExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "The image was not found!");
    }
    if (isImageExist.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, "The image is deleted!");
    }
  }
  next();
});

export const CollectionModel = model<TCollection>(
  "Collection",
  collectionSchema
);
