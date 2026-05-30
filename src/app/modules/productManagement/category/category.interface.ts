import { Types } from "mongoose";
import { TSeoData } from "../../seo/seo.interface";

export type TCategory = {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  image: Types.ObjectId;
  description: string;
  seo?: TSeoData;
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
