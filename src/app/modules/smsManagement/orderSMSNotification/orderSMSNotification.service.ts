import { TOrderSMSNotification } from "./orderSMSNotification.interface";
import { OrderSMSNotification } from "./orderSMSNotification.model";

const createOrderSMSNotificationIntoDB = async (
  notificationData: TOrderSMSNotification[]
) => {
  const result = await OrderSMSNotification.create(notificationData);
  return result;
};

const getAllOrderSMSNotificationSettings = async () => {
  const result = await OrderSMSNotification.find({}, {});
  return result;
};

const updateOrderSMSNotificationIntoDB = async (
  id: string,
  payload: TOrderSMSNotification
) => {
  const result = await OrderSMSNotification.findByIdAndUpdate(id, payload);

  return result;
};

export const OrderSMSNotificationServices = {
  createOrderSMSNotificationIntoDB,
  getAllOrderSMSNotificationSettings,
  updateOrderSMSNotificationIntoDB,
};
