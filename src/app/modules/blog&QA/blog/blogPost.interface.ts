import { Model, Types } from "mongoose";
import { TSeo } from "../../seo/seo.interface";

export type TBlogPost = {
  title: string;
  slug: string;
  featuredImage?: Types.ObjectId;
  content: string;
  excerpt?: string;
  readTime: number;
  category: Types.ObjectId;
  topic?: Types.ObjectId;
  tags?: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  relatedBlogs?: Types.ObjectId[];
  seo?: TSeo;
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
  views: number;
};

export type TBlogPostModel = Model<TBlogPost>;
