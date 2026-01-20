import { model, Schema } from "mongoose";
import { OrderSMSNotificationConst } from "./orderSMSNotification.const";
import { TOrderSMSNotification } from "./orderSMSNotification.interface";

const OrderSMSNotificationSchema = new Schema<TOrderSMSNotification>(
  {
    slug: {
      type: String,
      enum: OrderSMSNotificationConst.orderSMSNotificationType,
      required: true,
      unique: true,
      immutable: true,
    },
    defaultTemplate: {
      type: String,
      required: true,
    },
    customTemplate: {
      type: String,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    activeMedium: {
      type: [String],
      enum: OrderSMSNotificationConst.OrderSMSNotificationMedium,
      required: true,
      default: [],
    },
    emailSubject: {
      type: String,
      default: "Order Notification",
    },
  },
  { timestamps: true, versionKey: false }
);

export const OrderSMSNotification = model<TOrderSMSNotification>(
  "order_sms_notifications",
  OrderSMSNotificationSchema
);
