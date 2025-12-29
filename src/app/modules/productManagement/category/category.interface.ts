import { Types } from "mongoose";

// export type TSubCategory = {
//   name: string;
//   slug: string;
//   image: Types.ObjectId;
//   description: string;
//   createdBy: Types.ObjectId;
//   updatedBy: Types.ObjectId;
//   deletedBy: Types.ObjectId;
//   isDeleted: boolean;
// };

export type TCategory = {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  image: Types.ObjectId;
  description: string;
  // subcategories: [TSubCategory];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
  isActive: boolean;
};
