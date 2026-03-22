import { Document, Types } from "mongoose";
import { TShippingData } from "../orderManagement/shipping/shipping.interface";
import { TUser } from "../userManagement/user/user.interface";

export type TImageToOrderImage = {
  path: string;
};
export type TImageToOrderContactStatus =
  | "pending"
  | "confirmed"
  | "retry required";

export type TImageToOrderStatus =
  | "pending"
  | "confirmed"
  | "canceled"
  | "completed";

export type TImageToOrderData = {
  reqId: string;
  userId?: Types.ObjectId | TUser;
  sessionId: string;
  shipping: TShippingData;
  images: TImageToOrderImage[];
  customerNotes?: string;
  officialNote?: string;
  contactStatus: TImageToOrderContactStatus;
  status: TImageToOrderStatus;
  orderId?: Types.ObjectId;
};

export type TImageToOrder = TImageToOrderData & Document;
