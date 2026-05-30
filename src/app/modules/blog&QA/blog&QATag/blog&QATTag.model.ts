import { Schema, model } from "mongoose";
import { seoDataSchema } from "../../seo/seo.model";
import { TBlogQATag, TBlogQATagModel } from "./blog&QATag.interface";

const blogQATagSchema = new Schema<TBlogQATag, TBlogQATagModel>(
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

export const BlogQATag = model<TBlogQATag, TBlogQATagModel>(
  "BlogQATag",
  blogQATagSchema
);
