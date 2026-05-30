import { Model } from "mongoose";
import { TSeoData } from "../../seo/seo.interface";

export type TBlogQATag = {
  name: string;
  slug: string;
  description?: string;
  seo?: TSeoData;
  status: "active" | "inactive";
};

export type TBlogQATagModel = Model<TBlogQATag>;
