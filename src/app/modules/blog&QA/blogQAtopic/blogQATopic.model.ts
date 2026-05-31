import { Schema, model } from "mongoose";
import { TBlogQATopic, TBlogQATopicModel } from "./blogQATopic.interface";

const blogQATopicSchema = new Schema<TBlogQATopic, TBlogQATopicModel>(
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
    seo: { type: Schema.Types.ObjectId, ref: "Seo" },
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

export const BlogQATopic = model<TBlogQATopic, TBlogQATopicModel>(
  "BlogQATopic",
  blogQATopicSchema
);
