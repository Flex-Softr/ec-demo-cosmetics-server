import { Types } from "mongoose";
import { TSeo } from "../../seo/seo.interface";

export type TCategory = {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  image: Types.ObjectId;
  description: string;
  seo?: TSeo;
  parent: Types.ObjectId | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  children: TCategory[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedBy?: Types.ObjectId;
  isDeleted: boolean;
};
