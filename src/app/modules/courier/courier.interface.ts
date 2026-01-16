import mongoose, { Document } from "mongoose";
import { TImage } from "../image/image.interface";

export type TShippingMethodCredential = {
  key: string;
  value: string;
  need_to_hash?: boolean;
  is_optional?: boolean;
};

export type TShippingMethod = {
  name: string;
  slug: string;
  description?: string;
  thumb?: mongoose.Types.ObjectId | TImage;
  credentials?: TShippingMethodCredential[];

  isActive: boolean;
} & Document;

export type TCourier = TShippingMethod; // Alias for backward compatibility or transition
