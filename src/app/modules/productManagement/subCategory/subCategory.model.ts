import { Schema, model } from "mongoose";
import { TSubCategory } from "./subCategory.interface";

const subCategorySchema = new Schema<TSubCategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    image: { type: Schema.Types.ObjectId, ref: "Image" },
    description: { type: String },
    category: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
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

subCategorySchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase() // Convert the entire string to lowercase
      .split(" ") // Split the string into an array of words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
      .join(" "); // Convert to lowercase for uniqueness
  }
  next();
});

export const SubCategoryModel = model<TSubCategory>(
  "SubCategory",
  subCategorySchema
);
