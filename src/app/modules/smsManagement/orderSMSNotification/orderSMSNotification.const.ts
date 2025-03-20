import { TOrderSMSNotificationType } from "./orderSMSNotification.interface";

const orderSMSNotificationType: TOrderSMSNotificationType[] = [
  "order_created",
  "order_confirmed",
  "order_canceled",
  "product_picked_by_courier",
  "shifted",
];

export const OrderSMSNotificationConst = { orderSMSNotificationType };
