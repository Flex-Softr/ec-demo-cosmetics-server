import { Document } from "mongoose";

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
};

export type TOrderSMSNotification = TOrderSMSNotificationData & Document;
