import { Types } from "mongoose";

export type TSliderSection = {
  _id?: Types.ObjectId;
  name: string;
  image: Types.ObjectId;
  bannerLink?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
};
