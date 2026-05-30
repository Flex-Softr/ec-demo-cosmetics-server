import { Schema, model } from "mongoose";
import { TSeoData } from "./seoData.interface";
import { productSeoDataSchema } from "../../seo/seo.model";

const SeoDataSchema = new Schema<TSeoData>(productSeoDataSchema.obj, {
  timestamps: true,
  versionKey: false,
});

export const SeoDataModel = model<TSeoData>("SeoData", SeoDataSchema);
