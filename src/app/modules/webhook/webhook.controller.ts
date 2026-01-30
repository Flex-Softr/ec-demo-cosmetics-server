import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { WebhookService } from "./webhook.service";

const parcelStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await WebhookService.parcelStatusHandler(req);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const WebhookController = {
  parcelStatusHandler,
};
