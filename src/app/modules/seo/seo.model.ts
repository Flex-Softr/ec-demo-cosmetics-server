import { Schema } from "mongoose";
import { TProductSeoData, TSeoData } from "./seo.interface";

export const seoDataSchema = new Schema<TSeoData>(
  {
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    schemaMarkup: { type: String },
  },
  { _id: false }
);

export const productSeoDataSchema = new Schema<TProductSeoData>(
  {
    focusKeyphrase: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    slug: { type: String },
    schemaMarkup: { type: String },
  },
  { _id: false }
);
