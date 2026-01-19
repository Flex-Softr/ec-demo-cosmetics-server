import { Document } from "mongoose";

export type TOrderSMSNotificationMediumType = "phone" | "email" | "whatsapp";

export type TOrderSMSNotificationType =
  | "order_created"
  | "order_confirmed"
  | "order_canceled"
  | "courier_assigned"
  | "shifted";

export type TOrderSMSNotificationData = {
  slug: TOrderSMSNotificationType;
  defaultTemplate: string;
  customTemplate?: string;
  isActive: boolean;
  activeMedium: TOrderSMSNotificationMediumType[];
  emailSubject?: string;
};

export type TOrderSMSNotification = TOrderSMSNotificationData & Document;
