import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { SMSReportServices } from "./smsReport.service";

const getOrderSMSNotification = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SMSReportServices.getSMSCountFromDB();

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Retrieved total sms send count successfully!",
      data: result,
    });
  }
);

export const SMSReportController = {
  getOrderSMSNotification,
};
