import { Document, Types } from "mongoose";

export type TCollection = {
  name: string;
  slug: string;
  image?: Types.ObjectId;
  isActive: boolean;
  sortOrder: number;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
} & Document;
