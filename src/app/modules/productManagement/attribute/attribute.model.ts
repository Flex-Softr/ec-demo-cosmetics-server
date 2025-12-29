import { Schema, model } from "mongoose";
import { TAttribute, TAttributeValues } from "./attribute.interface";

const attributeValuesSchema = new Schema<TAttributeValues>({
  name: { type: String },
  isDeleted: { type: Boolean, default: false },
});

const attributeSchema = new Schema<TAttribute>(
  {
    name: { type: String, unique: true, sparse: true },
    values: { type: [attributeValuesSchema] },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },

  {
    timestamps: true,
  }
);

export const AttributeModel = model<TAttribute>("Attribute", attributeSchema);
