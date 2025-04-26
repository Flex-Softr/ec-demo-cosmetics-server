import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { smsServices } from "./sms.service";

const sendBulkSms = catchAsync(async (req: Request, res: Response) => {
  const { mobileNumbers, messageBody } = req.body;
  await smsServices.sendBulkSms(mobileNumbers, messageBody);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "SMS sended successfully",
  });
});

export const smsController = {
  sendBulkSms,
};
