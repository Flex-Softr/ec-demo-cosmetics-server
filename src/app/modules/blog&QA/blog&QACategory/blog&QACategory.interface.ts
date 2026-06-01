import { Model } from "mongoose";
import { TSeo } from "../../seo/seo.interface";

export type TBlogQAcategory = {
  name: string;
  slug: string;
  description?: string;
  seo?: TSeo;
  status: "active" | "inactive";
};

export type TBlogQAcategoryModel = Model<TBlogQAcategory>;
