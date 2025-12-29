import httpStatus from "http-status";
import { Schema, model } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { ImageModel } from "../../image/image.model";
import { TCategory } from "./category.interface";

// const subcategorySchema = new Schema<TCategory>({
//   name: { type: String, required: true, unique: true },
//   slug: { type: String, required: true, unique: true },
//   image: { type: Schema.Types.ObjectId, ref: "Image" },
//   description: { type: String },
//   isDeleted: { type: Boolean, default: false },
// });

const categorySchema = new Schema<TCategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    image: { type: Schema.Types.ObjectId, ref: "Image" },
    description: { type: String },
    // subcategories: [subcategorySchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },

  {
    timestamps: true,
  }
);

categorySchema.pre("save", async function (next) {
  if (this.name) {
    this.name = this.name
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase() // Convert the entire string to lowercase
      .split(" ") // Split the string into an array of words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
      .join(" "); // Convert to lowercase for uniqueness
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

export const CategoryModel = model<TCategory>("Category", categorySchema);
