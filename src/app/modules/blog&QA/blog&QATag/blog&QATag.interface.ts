import { Model } from "mongoose";

export type TBlogQATag = {
  name: string;
  slug: string;
  status: "active" | "inactive";
};

export type TBlogQATagModel = Model<TBlogQATag>;
