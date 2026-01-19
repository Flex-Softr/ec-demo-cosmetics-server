import { TOrderSMSNotificationType } from "./orderSMSNotification.interface";

const orderSMSNotificationType: TOrderSMSNotificationType[] = [
  "order_created",
  "order_confirmed",
  "order_canceled",
  "courier_assigned",
  "shifted",
];

export const OrderSMSNotificationMedium = [
  "phone",
  "email",
  "whatsapp",
] as const;

export const OrderSMSNotificationConst = {
  orderSMSNotificationType,
  OrderSMSNotificationMedium,
};
