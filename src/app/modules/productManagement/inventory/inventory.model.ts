import { Schema, model } from "mongoose";
import { stockStatus } from "./inventory.const";
import { TInventory } from "./inventory.interface";

export const inventorySchema = new Schema<TInventory>(
  {
    sku: { type: String, unique: true, sparse: true },
    stockStatus: { type: String, enum: [...stockStatus], required: true },
    stockQuantity: { type: Number, required: true },
    stockAvailable: {
      type: Number,
      required: true,
      default: function (this: TInventory) {
        return this.stockQuantity;
      },
    },
    // productCode: { type: String },
    manageStock: { type: Boolean, default: false },
    lowStockWarning: { type: Number },
    // showStockQuantity: { type: Boolean, default: false },
    // showStockWithText: { type: Boolean, default: false },
    hideStock: { type: Boolean, default: false },
    // soldIndividually: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const InventoryModel = model<TInventory>("Inventory", inventorySchema);
