import { Types } from "mongoose";

export type TBrand = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  isActive: boolean;
};
