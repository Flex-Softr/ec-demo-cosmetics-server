import { Schema, model } from "mongoose";
import { TPaymentMethod, TRequiredInput } from "./paymentMethod.interface";

const requiredInputSchema = new Schema<TRequiredInput>(
  {
    type: {
      type: String,
      enum: ["text", "number", "select"],
      required: true,
    },
    name: { type: String, required: true },
    is_required: { type: Boolean, default: false },
    enums: { type: String },
  },
  {
    _id: false,
    versionKey: false,
  }
);

const PaymentMethodSchema = new Schema<TPaymentMethod>(
  {
    name: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    logo: {
      type: Schema.Types.ObjectId,
      ref: "Image",
    },
    required_inputs: [requiredInputSchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PaymentMethod = model<TPaymentMethod>(
  "PaymentMethod",
  PaymentMethodSchema
);
