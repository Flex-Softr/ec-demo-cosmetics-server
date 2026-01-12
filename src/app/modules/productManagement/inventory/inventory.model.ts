import { Schema, model } from "mongoose";
import { stockStatus } from "./inventory.const";
import { TInventory } from "./inventory.interface";

export const inventorySchema = new Schema<TInventory>(
  {
    sku: { type: String, unique: true, sparse: true },
    stockStatus: { type: String, enum: [...stockStatus], required: true },
    stockQuantity: { type: Number, default: 0 },
    stockAvailable: { type: Number, default: 0 },
    manageStock: { type: Boolean, default: false },
    lowStockWarning: { type: Number },
    hideStock: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const InventoryModel = model<TInventory>("Inventory", inventorySchema);
