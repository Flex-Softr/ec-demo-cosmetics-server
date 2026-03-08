import { Document } from "mongoose";
import { TCollection } from "../productManagement/collection/collection.interface";

export type THomePageInput = {
  title: string;
  subtitle?: string;
  collectionId: string | TCollection;
  sortOrder?: number;
  limit?: number;
  ctaText?: string;
  ctaLink?: string;
  isActive?: boolean;
};

export type THomePageSection = Document & THomePageInput;
