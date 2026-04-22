import { Document } from "mongoose";

export type TContactMessage = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
};

export type TContactMessageDocument = Document & TContactMessage;
