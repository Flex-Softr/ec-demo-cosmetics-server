import { Document, Types } from "mongoose";
import { TSelectedAttributes } from "../../types/attribute";
import {
  TProduct,
  TVariation,
} from "../productManagement/product/product.interface";

export type TSelectedAttributesOnCart = {
  name: string;
  value: string;
};

export type TCartData = {
  userId?: Types.ObjectId;
  sessionId?: string;
  product: Types.ObjectId | TProduct;
  attributes: TSelectedAttributes[];
  variation?: Types.ObjectId | TVariation;
  quantity: number;
  expireAt?: Date;
};

export type TCartResponse = {
  product: {
    _id: Types.ObjectId;
    id: string;
    title: string;
    image: { src: string; alt: string };
    slug: string;
  };
  price: {
    regularPrice: number;
    salePrice: number;
  };
  variation?: {
    _id: Types.ObjectId;
    attributes: Record<string, string>;
  };
  quantity: number;
  _id: Types.ObjectId;
};

export type TCart = TCartData & Document;
