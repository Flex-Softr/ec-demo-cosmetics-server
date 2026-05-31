import { Model, Types } from "mongoose";
import { TSeo } from "../../seo/seo.interface";

export type TQnA = {
  question: string;
  slug: string;
  answer: string;
  author?: Types.ObjectId;
  category: Types.ObjectId;
  tags?: Types.ObjectId[];
  relatedQuestions?: Types.ObjectId[];
  seo?: TSeo;
  status: "draft" | "published" | "archived";
  views: number;
};

export type TQnAModel = Model<TQnA>;
