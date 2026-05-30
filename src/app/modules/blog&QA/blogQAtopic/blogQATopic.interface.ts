import { Model } from "mongoose";
import { TSeoData } from "../../seo/seo.interface";

export type TBlogQATopic = {
  name: string;
  slug: string;
  description?: string;
  seo?: TSeoData;
  status: "active" | "inactive";
};

export type TBlogQATopicModel = Model<TBlogQATopic>;
