import { model, Schema } from "mongoose";
import { TVariation } from "./variation.interface";

const productVariationsSchema = new Schema<TVariation>(
  {
    serial: {
      type: Number,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    attributes: {
      type: Map,
      of: String,
    },
    price: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Price",
    },
    inventory: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Inventory",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const VariationModel = model<TVariation>("Variation", productVariationsSchema);

export default VariationModel;
