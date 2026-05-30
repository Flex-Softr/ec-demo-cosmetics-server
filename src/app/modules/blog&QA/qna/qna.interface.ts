import { Model, Types } from "mongoose";
import { TSeoData } from "../../seo/seo.interface";

export type TQnA = {
  question: string;
  slug: string;
  answer: string;
  author?: Types.ObjectId;
  category: Types.ObjectId;
  tags?: Types.ObjectId[];
  relatedQuestions?: Types.ObjectId[];
  seo?: TSeoData;
  status: "draft" | "published" | "archived";
  views: number;
};

export type TQnAModel = Model<TQnA>;
