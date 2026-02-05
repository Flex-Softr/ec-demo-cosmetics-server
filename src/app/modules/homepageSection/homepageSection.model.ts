import { Schema, model } from "mongoose";
import { THomePageSection } from "./homepageSection.interface";

const homepageSectionSchema = new Schema<THomePageSection>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    collectionId: {
      type: String,
      required: true,
      ref: "Collection",
    },
    sortOrder: { type: Number, default: 1 },
    limit: {
      type: Number,
      default: 10,
    },
    ctaText: { type: String },
    ctaLink: { type: String },
  },
  {
    timestamps: true,
  }
);

export const HomepageSectionModel = model<THomePageSection>(
  "HomepageSection",
  homepageSectionSchema
);
