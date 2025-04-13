import { Document, Types } from "mongoose";
// import { TAttribute } from "../attribute/attribute.interface";
import { TInventory } from "../inventory/inventory.interface";
import { TPrice } from "../price/price.interface";
import { TVariation } from "../variation/variation.interface";

export type TPublishedStatus = "Draft" | "Published";
export type TVisibilityStatus = "Public" | "Private" | "Password protected";
export type TPublishedStatusSchema = {
  status: TPublishedStatus;
  visibility: TVisibilityStatus;
  date: string | Date;
};
export type TProductImage = {
  thumbnail: Types.ObjectId;
  gallery: Types.ObjectId[];
};
export type TCategorySchema = {
  name: Types.ObjectId;
  subCategory?: Types.ObjectId;
};

export type TProductAttribute = {
  name: Types.ObjectId;
  values: Types.ObjectId[];
};

export type TWarrantyInfo = {
  duration: string;
  terms: string;
};

export type TProduct = {
  id: string;
  title: string;
  // permalink?: string;
  // type?: string;
  slug: string;
  description: string;
  shortDescription?: string;
  additionalInfo?: string;
  usageGuidelines?: string;
  // downloadable?: boolean;
  featured?: boolean;
  // review?: boolean;
  price: Types.ObjectId | TPrice;
  image: TProductImage; //| TProductImage
  inventory: Types.ObjectId | TInventory;
  attributes: TProductAttribute[];
  variations: Types.ObjectId[] | TVariation[];
  brand: Types.ObjectId;
  category: TCategorySchema;
  warranty: boolean;
  warrantyInfo: TWarrantyInfo;
  // tag: Types.ObjectId[];
  // seoData: Types.ObjectId; // | TSeoData
  publishedStatus: TPublishedStatusSchema;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
} & Document;
