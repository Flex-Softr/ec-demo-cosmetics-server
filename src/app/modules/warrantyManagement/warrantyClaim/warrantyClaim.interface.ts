import mongoose, { Document, Types } from "mongoose";
import { TOrderedProduct } from "../../orderManagement/order/order.interface";
import { TShipping } from "../../orderManagement/shipping/shipping.interface";
import { TVariation } from "../../productManagement/product/product.interface";
import { TUser } from "../../userManagement/user/user.interface";
import { TWarrantyClaimHistory } from "../warrantyClaimHistory/warrantyClaimHistory.interface";

export type TWarrantyClaimedContactStatus =
  | "pending"
  | "confirmed"
  | "retry required";
export type TWarrantyClaimedProductCondition = "pending" | "solved" | "problem";
export type TWarrantyApprovalStatus = "approved";
export type TWarrantyClaimedVideosAndImages = {
  path: string;
  fileType: string;
};

export type TWarrantyClaimPrevWarrantyInformation = {
  duration: {
    quantity: string;
    unit: string;
  };
  startDate?: string;
  endsDate?: string;
};

export type TWarrantyClaimReqData = {
  order_id: Types.ObjectId;
  orderItemId: Types.ObjectId | TOrderedProduct;
  productId: Types.ObjectId;
  variation: Types.ObjectId | TVariation;
  attributes?: {
    [key: string]: string;
  };
  claimedCodes: string[];
  prevWarrantyInformation: TWarrantyClaimPrevWarrantyInformation;
  warrantyClaimHistory: Types.ObjectId | TWarrantyClaimHistory;
};

export type TClaimedCodes = { code: string; _id?: Types.ObjectId };

export type TWarrantyClaimData = {
  reqId: string;
  phoneNumber: string;
  shipping: TShipping;
  problemInDetails: string;
  videosAndImages?: TWarrantyClaimedVideosAndImages[];
  warrantyClaimReqData: TWarrantyClaimReqData[];
  officialNotes?: string;
  contactStatus: TWarrantyClaimedContactStatus;
  result: TWarrantyClaimedProductCondition;
  identifiedBy: mongoose.Types.ObjectId | TUser;
  approvalStatus: TWarrantyApprovalStatus;
  finalCheckedBy: mongoose.Types.ObjectId | TUser;
  orderId?: Types.ObjectId;
};

export type TWarrantyClaim = TWarrantyClaimData & Document;

export type TWarrantyClaimedProductDetails = TOrderedProduct & {
  claimedCodes: TClaimedCodes[];
  prevWarrantyInformation: TWarrantyClaimPrevWarrantyInformation;
  warrantyClaimHistory: Types.ObjectId;
};
