import { Schema, model } from "mongoose";
import { TContactMessageDocument } from "./contactMessage.interface";

const contactMessageSchema = new Schema<TContactMessageDocument>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const ContactMessageModel = model<TContactMessageDocument>(
  "ContactMessage",
  contactMessageSchema
);
