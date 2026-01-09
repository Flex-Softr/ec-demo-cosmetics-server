import httpStatus from "http-status";
import { Schema, model } from "mongoose";
import ApiError from "../../errorHandlers/ApiError";
import { ImageModel } from "../image/image.model";
import { TBannerSlider } from "./bannerSlider.interface";

const bannerSliderSchema = new Schema<TBannerSlider>(
  {
    name: { type: String },
    image: { type: Schema.Types.ObjectId, ref: "Image", required: true },
    bannerLink: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

bannerSliderSchema.pre("save", async function (next) {
  if (this.name) {
    this.name = this.name
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

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

export const BannerSliderModel = model<TBannerSlider>(
  "BannerSlider",
  bannerSliderSchema
);
