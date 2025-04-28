import { Types } from "mongoose";
import { TInventory } from "../inventory/inventory.interface";
import { TPrice } from "../price/price.interface";

export type TVariation = {
  _id?: Types.ObjectId;
  productId: string;
  attributes: {
    [key: string]: string;
  };
  price: TPrice;
  inventory: TInventory;
  isDeleted?: boolean;
};
