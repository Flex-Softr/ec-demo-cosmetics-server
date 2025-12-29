import { Types } from "mongoose";

export type TAttributeValues = {
  _id?: string;
  name: string;
  isDeleted: boolean;
};

export type TAttribute = {
  _id?: Types.ObjectId;
  name: string;
  values: TAttributeValues[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
  isActive: boolean;
};
