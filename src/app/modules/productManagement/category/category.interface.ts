import { Types } from "mongoose";

export type TCategory = {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  image: Types.ObjectId;
  description: string;
  parent: Types.ObjectId | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  subcategories: TCategory[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedBy?: Types.ObjectId;
  isDeleted: boolean;
};
