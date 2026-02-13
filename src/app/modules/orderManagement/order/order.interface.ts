import mongoose, { Document, Types } from "mongoose";
import { TCourier } from "../../courier/courier.interface";
import { TCategory } from "../../productManagement/category/category.interface";
import { TInventory } from "../../productManagement/inventory/inventory.interface";
import { TPrice } from "../../productManagement/price/price.interface";
import {
  TProduct,
  TPublishedStatus,
} from "../../productManagement/product/product.interface";
import { TVariation } from "../../productManagement/variation/variation.interface";
import { TUser } from "../../userManagement/user/user.interface";
import {
  TWarranty,
  TWarrantyCodes,
} from "../../warrantyManagement/warranty/warranty.interface";
import {
  TClaimedCodes,
  TWarrantyClaimPrevWarrantyInformation,
} from "../../warrantyManagement/warrantyClaim/warrantyClaim.interface";
import { TWarrantyClaimHistory } from "../../warrantyManagement/warrantyClaimHistory/warrantyClaimHistory.interface";
import { TOrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.interface";
import { TShipping } from "../shipping/shipping.interface";
import { TShippingCharge } from "../shippingCharge/shippingCharge.interface";

export type TOrderStatus =
  | "pending"
  | "confirmed"
  | "follow up"
  | "processing"
  | "warranty processing"
  | "processing done"
  | "warranty added"
  | "On courier"
  | "returned"
  | "partial completed"
  | "completed"
  | "canceled"
  | "deleted";

export type TOrderSourceName =
  | "Website"
  | "Landing Page"
  | "App"
  | "Phone Call"
  | "Social Media"
  | "From Office"
  | "Warranty Claimed"
  | "Image to order"
  | "Old Server";

export type TCourierProviders = "steadfast";

export type TOrderSource = {
  name: TOrderSourceName;
  url?: string;
  lpNo?: string;
};

export type TOrderedProduct = {
  product: mongoose.Types.ObjectId | TProduct;
  variation?: Types.ObjectId | TVariation;
  attributes?: {
    [key: string]: string;
  };
  unitPrice: number;
  quantity: number;
  total: number;
  warranty?: mongoose.Types.ObjectId | TWarranty;
  isWarrantyClaim?: boolean;
  warrantyClaimHistory: Types.ObjectId | TWarrantyClaimHistory;
  claimedCodes?: {
    code: string;
  }[];
  prevWarrantyInformation?: TWarrantyClaimPrevWarrantyInformation;
} & Document;

export type TCourierDetails = {
  courierProvider: mongoose.Types.ObjectId | TCourier;
  trackingId: string;
} & Document;

export type TOrderData = {
  orderId: string;
  userId: Types.ObjectId | TUser;
  sessionId: string;
  orderedProducts: TOrderedProduct[];
  couponDetails?: Types.ObjectId;
  couponDiscount?: number;
  subtotal?: number;
  tax?: number;
  shippingCharge: Types.ObjectId | TShippingCharge;
  discount?: number;
  advance?: number;
  warrantyAmount: number;
  total: number;
  payment: Types.ObjectId;
  status: TOrderStatus;
  deliveryStatus: string;
  monitoringStatus: string;
  trackingStatus: string;
  followUpDate?: string;
  statusHistory: Types.ObjectId | TOrderStatusHistory;
  shipping: Types.ObjectId | TShipping;
  isDeleted: boolean;
  orderNotes?: string;
  officialNotes?: string;
  invoiceNotes?: string;
  courierNotes?: string;
  monitoringNotes?: string;
  reasonNotes?: string;
  courierDetails?: TCourierDetails;
  statusFromShippingProvider?: string;
  messageFromShippingProvider?: string;
  orderSource: TOrderSource;
  userIp?: string;
  division?: string;
  district?: string;
};

export type TOrder = TOrderData & Document;

export type TSanitizedOrProduct = {
  product: {
    _id: mongoose.Types.ObjectId;
    title: string;
    price?: TPrice;
    isDeleted: boolean;
    stock?: TInventory;
    defaultInventory?: Types.ObjectId;
    isVariationAvailable?: boolean;
    category: TCategory[] | mongoose.Types.ObjectId[];
    publishedStatus: TPublishedStatus;
  };
  quantity: number;
  variation?: Types.ObjectId;
  isWarrantyClaim?: boolean;
  claimedCodes?: TClaimedCodes[];
  prevWarrantyInformation?: TWarrantyClaimPrevWarrantyInformation;
  attributes?: {
    [key: string]: string;
  };
  warrantyClaimHistory?: Types.ObjectId;
};

export type TCourierResponse = {
  invoice: string;
  tracking_code: string;
  status: string;
};

export type TOrderStatusWithDesc = {
  status: TOrderStatus;
  description: {
    en?: string;
    bn: string;
  };
};

export type TOrderDeliveryStatus =
  | "pending"
  | "delivered_approval_pending"
  | "partial_delivered_approval_pending"
  | "cancelled_approval_pending"
  | "unknown_approval_pending"
  | "delivered"
  | "partial_delivered"
  | "cancelled"
  | "hold"
  | "in_review"
  | "unknown";

export type TFindOrderForUpdatingOrder = {
  _id: Types.ObjectId;
  orderedProducts: {
    _id: Types.ObjectId;
    product: Types.ObjectId;
    productTitle: string;
    attributes: Record<string, string>;
    unitPrice: number;
    quantity: number;
    total: number;
    productWarrantyDetails: TWarranty;
    isWarrantyClaim: boolean;
    variation: Types.ObjectId;
    variations: TVariation[];
    // inventoryInfo: TInventory & { variation?: Types.ObjectId };
    inventoryInfo: {
      variationInventory: TInventory & { variation?: Types.ObjectId };
      defaultInventory: TInventory;
    };
    warranty: Types.ObjectId;
    claimedCodes?: TWarrantyCodes[];
    image?: {
      src: string;
      alt: string;
    };
  }[];
  couponDetails: Types.ObjectId;
  subtotal: number;
  tax: number;
  shippingCharge: { _id: Types.ObjectId; amount: number };
  discount: number;
  payment: Types.ObjectId;
  shipping: Types.ObjectId;
  advance: number;
  couponDiscount: number;
  warrantyAmount: number;
  total: number;
  status: TOrderStatus;
  deliveryStatus: string;
};

export type TSMSReceiverInfo = {
  phoneNumber: string;
  fullName: string;
  email?: string;
  orderId: string;
  trackingId?: string;
  trackingUrl?: string;
  total?: string;
};
