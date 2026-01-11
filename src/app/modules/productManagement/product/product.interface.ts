import { Document, Types } from "mongoose";
import { PRODUCT_STATUS, PRODUCT_TYPE } from "./product.const";
// import { TAttribute } from "../attribute/attribute.interface";
import { TInventory } from "../inventory/inventory.interface";
import { TPrice } from "../price/price.interface";
import { TVariation } from "../variation/variation.interface";

export type TPublishedStatus =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

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
  duration: {
    quantity: string;
    unit: string;
  };
  terms: string;
};

export type TSeoData = {
  focusKeyphrase: string;
  metaTitle: string;
  slug: string;
  metaDescription: string;
};

export type TTag = {
  label: string;
  value: string;
};

export type TProduct = {
  id: string;
  title: string;
  // permalink?: string;
  type: TProductType;
  slug: string;
  description: string;
  shortDescription?: string;
  additionalInfo?: string;
  usageGuidelines?: string;
  // downloadable?: boolean;
  featured?: boolean;
  review?: boolean;
  price?: Types.ObjectId | TPrice;
  image: TProductImage; //| TProductImage
  inventory?: Types.ObjectId | TInventory;
  attributes: TProductAttribute[];
  variations: Types.ObjectId[] | TVariation[];
  brand: Types.ObjectId;
  category: TCategorySchema;
  warranty: boolean;
  warrantyInfo: TWarrantyInfo;
  tag?: TTag[];
  seoData?: TSeoData;
  publishedStatus: TPublishedStatus;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedBy?: Types.ObjectId;
  isDeleted: boolean;
  productCollection?: Types.ObjectId;
  offer?: {
    flash: boolean;
    today: boolean;
    featured: boolean;
  };
} & Document;

export type TProductType = (typeof PRODUCT_TYPE)[keyof typeof PRODUCT_TYPE];

export type TProductPayload = {
  title: string;
  slug: string;
  type: TProductType;
  description: string;
  shortDescription?: string;
  additionalInfo?: string;
  usageGuidelines?: string;
  price: {
    regularPrice: number;
    salePrice?: number;
    discountPercent?: number;
    priceSave?: number;
    date?: {
      start: string;
      end: string;
    };
  };
  image: {
    thumbnail: string;
    gallery: string[];
  };
  inventory: {
    sku: string;
    stockStatus?: string;
    stockQuantity?: number;
    stockAvailable?: number;
    preStockQuantity?: number;
    productCode?: string;
    manageStock?: boolean;
    lowStockWarning?: number;
    hideStock?: boolean;
  };
  attributes?: {
    name: string;
    values: string[];
  }[];
  variations?: Record<string, unknown>[];
  category: {
    name: string;
    subCategory?: string;
  };
  brand?: string;
  tag?: {
    label: string;
    value: string;
  }[];
  seoData?: {
    focusKeyphrase: string;
    metaTitle: string;
    slug: string;
    metaDescription: string;
  };
  offer?: {
    flash: boolean;
    today: boolean;
    featured: boolean;
  };
  featured?: boolean;
  downloadable?: boolean;
  review?: boolean;
  warranty: boolean;
  warrantyInfo?: {
    duration: {
      quantity: string;
      unit: string;
    };
    terms: string;
  };
  publishedStatus: TPublishedStatus;
  productCollection?: string;
};

export type IAdminProduct = {
  _id: string;
  title: string;
  stockStatus: string;
  stockAvailable: number;
  sku: string;
  thumbnail: {
    _id: string;
    src: string;
    alt: string;
  };
  category: {
    _id: string;
    name: string;
  };
  publishedStatus: TPublishedStatus;
  regularPrice: number;
  salePrice?: number;
};

export type IAdminProductResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: {
    countsByStatus: {
      name: string;
      total: number;
    }[];
    data: IAdminProduct[];
  };
};

export { TVariation };
