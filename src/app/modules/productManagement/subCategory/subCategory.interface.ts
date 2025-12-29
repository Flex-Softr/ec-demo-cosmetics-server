import { Types } from "mongoose";

export type TSubCategory = {
  name: string;
  slug: string;
  image: Types.ObjectId;
  description: string;
  category: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
  isActive: boolean;
};
