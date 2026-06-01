import { Model } from "mongoose";
import { TSeo } from "../../seo/seo.interface";
import { Types } from "mongoose";

export type TBlogQATopic = {
  name: string;
  slug: string;
  category: Types.ObjectId;
  description?: string;
  seo?: TSeo;
  status: "active" | "inactive";
};

export type TBlogQATopicModel = Model<TBlogQATopic>;
