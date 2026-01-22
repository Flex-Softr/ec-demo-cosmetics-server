import { Document } from "mongoose";

export type THomePageInput = {
  title?: string;
  subtitle: string;
  collectionId: string;
  sortOrder: number;
};

export type THomePageSection = Document & THomePageInput;
