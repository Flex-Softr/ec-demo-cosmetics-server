import { model, Schema } from "mongoose";
import { TVariation } from "./variation.interface";
import { stockStatus } from "../inventory/inventory.const";

const productVariationsSchema = new Schema<TVariation>({
  attributes: {
    type: Map,
    of: String,
  },
  price: {
    regularPrice: { type: Number, required: true },
    salePrice: { type: Number },
    discountPercent: { type: Number },
    priceSave: { type: Number },
  },
  inventory: {
    sku: { type: String, unique: true, sparse: true },
    stockStatus: { type: String, enum: [...stockStatus], required: true },
    stockQuantity: { type: Number, required: true },
    stockAvailable: { type: Number, required: true },
    productCode: { type: String },
    manageStock: { type: Boolean, default: false },
    lowStockWarning: { type: Number },
    hideStock: { type: Boolean, default: false },
  },
  // isDeleted: { type: Boolean, default: false },
});

const VariationModel = model<TVariation>("Variation", productVariationsSchema);

export default VariationModel;
