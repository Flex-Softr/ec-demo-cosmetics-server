import { model, Schema } from "mongoose";
import { TSeo } from "./seo.interface";

const SeoSchema = new Schema<TSeo>({
  metaTitle: { type: String },
  metaDescription: { type: String },
  keywords: [{ type: String }],
  canonicalUrl: { type: String },
  schemaMarkup: { type: String },
});

const SeoModel = model<TSeo>("Seo", SeoSchema);

export default SeoModel;
