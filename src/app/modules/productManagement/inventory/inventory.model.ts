import { Schema, model } from "mongoose";
import { stockStatus } from "./inventory.const";
import { TInventory } from "./inventory.interface";

export const inventorySchema = new Schema<TInventory>(
  {
    sku: { type: String, unique: true, sparse: true },
    stockStatus: { type: String, enum: [...stockStatus], required: true },
    stockQuantity: { type: Number, default: 0 }, // stock quntity will act as whole quantiry of available in the system
    stockAvailable: { type: Number, default: 0 }, // stock available will act only current available quantity, when stock quantity is updated, stock available will be updated by minus the previous stock quantity and add the new stock quantity
    manageStock: { type: Boolean, default: false },
    lowStockWarning: { type: Number, default: 0 },
    hideStock: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const InventoryModel = model<TInventory>("Inventory", inventorySchema);
