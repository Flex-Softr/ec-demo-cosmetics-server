import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { OrderSMSNotificationServices } from "./orderSMSNotification.service";

const createOrderSMSNotification = catchAsync(
  async (req: Request, res: Response) => {
    const { notificationData } = req.body;
    const result =
      await OrderSMSNotificationServices.createOrderSMSNotificationIntoDB(
        notificationData
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order sms notification data created successfully!",
      data: result,
    });
  }
);

const getOrderSMSNotification = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await OrderSMSNotificationServices.getAllOrderSMSNotificationSettings();
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order sms notification data retrieved successfully!",
      data: result,
    });
  }
);

const updateOrderSMSNotification = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await OrderSMSNotificationServices.updateOrderSMSNotificationIntoDB(
        req.params.id,
        req.body
      );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order sms notification updated successfully!",
      data: result,
    });
  }
);

export const OrderSMSNotificationController = {
  createOrderSMSNotification,
  getOrderSMSNotification,
  updateOrderSMSNotification,
};
