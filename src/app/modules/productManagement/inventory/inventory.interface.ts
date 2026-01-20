import { Document, Types } from "mongoose";
import { STOCK_STATUS } from "./inventory.const";

export type TStockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS];

export type TInventory = {
  product: Types.ObjectId;
  stockStatus: TStockStatus;
  stockQuantity: number;
  stockAvailable?: number;
  sku?: string;
  productCode?: string;
  manageStock: boolean;
  lowStockWarning: number;
  hideStock: boolean;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
} & Document;
