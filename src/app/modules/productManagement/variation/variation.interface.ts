import { Types } from "mongoose";
import { TInventory } from "../inventory/inventory.interface";
import { TPrice } from "../price/price.interface";

export type TVariation = {
  _id?: Types.ObjectId;
  serial: number;
  productId: string;
  attributes: {
    [key: string]: string;
  };
  price: Types.ObjectId | TPrice;
  inventory: Types.ObjectId | TInventory;
  isDeleted?: boolean;
};
