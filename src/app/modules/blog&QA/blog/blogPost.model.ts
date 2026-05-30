import { Schema, model } from "mongoose";
import { seoDataSchema } from "../../seo/seo.model";
import { TBlogPost, TBlogPostModel } from "./blogPost.interface";

const blogPostSchema = new Schema<TBlogPost, TBlogPostModel>(
  {
    title: {
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
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
    },
    readTime: {
      type: Number,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "BlogQACategory",
      required: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "BlogQATag",
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    featuredImage: {
      type: Schema.Types.ObjectId,
      ref: "Image",
    },
    relatedBlogs: [
      {
        type: Schema.Types.ObjectId,
        ref: "BlogPost",
      },
    ],
    seo: seoDataSchema,
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    views: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const BlogPost = model<TBlogPost, TBlogPostModel>(
  "BlogPost",
  blogPostSchema
);
