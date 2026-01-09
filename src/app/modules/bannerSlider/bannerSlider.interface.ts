import { Types } from "mongoose";

export type TBannerSlider = {
  _id?: Types.ObjectId;
  name?: string;
  image: Types.ObjectId;
  bannerLink?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedBy?: Types.ObjectId;
  isDeleted?: boolean;
};
