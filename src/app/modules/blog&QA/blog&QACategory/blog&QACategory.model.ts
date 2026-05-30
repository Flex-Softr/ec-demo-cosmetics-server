import { Schema, model } from "mongoose";
import { seoDataSchema } from "../../seo/seo.model";
import {
  TBlogQAcategory,
  TBlogQAcategoryModel,
} from "./blog&QACategory.interface";

const blogQAcategorySchema = new Schema<TBlogQAcategory, TBlogQAcategoryModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
    },
    seo: seoDataSchema,
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const BlogQAcategory = model<TBlogQAcategory, TBlogQAcategoryModel>(
  "BlogQACategory",
  blogQAcategorySchema
);
