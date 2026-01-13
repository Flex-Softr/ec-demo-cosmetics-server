import { Types } from "mongoose";

export type TPrice = {
  regularPrice: number;
  salePrice?: number;
  discountPercent?: number;
  priceSave?: number;
  updatedBy?: Types.ObjectId;
};
