import { Schema, model } from "mongoose";
import { TQnA, TQnAModel } from "./qna.interface";

const qnaSchema = new Schema<TQnA, TQnAModel>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "BlogQACategory",
      required: true,
    },
    topic: {
      type: Schema.Types.ObjectId,
      ref: "BlogQATopic",
      required: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "BlogQATag",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    relatedQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: "QnA",
      },
    ],
    seo: { type: Schema.Types.ObjectId, ref: "Seo" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const QnA = model<TQnA, TQnAModel>("QnA", qnaSchema);
