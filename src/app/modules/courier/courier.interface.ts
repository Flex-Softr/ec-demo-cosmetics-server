import mongoose from "mongoose";
import { TImage } from "../image/image.interface";

export type TCourierCredentials = [string, string];

export type TCourierData = {
  name: string;
  slug: string;
  image: mongoose.Types.ObjectId | TImage;
  // website?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  secretKey?: string;
  credentials?: string[];
  isActive: boolean;
};

export type TCourier = TCourierData & Document;
