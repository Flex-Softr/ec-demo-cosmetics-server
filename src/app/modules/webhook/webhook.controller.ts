import { Request, Response } from "express";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { TShippingMethodSlug } from "./webhook.interface";
import { WebhookService } from "./webhook.service";

const parcelStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await WebhookService.parcelStatusHandler(req);

  const provider = req.params.provider as TShippingMethodSlug;
  if (provider === "pathao") {
    res.header(
      "X-Pathao-Merchant-Webhook-Integration-Secret",
      "f3992ecc-59da-4cbe-a049-a13da2018d51"
    );
  }

  successResponse(res, {
    statusCode: result.statusCode,
    success: true,
    message: result.message,
    data: null,
  });
});

export const WebhookController = {
  parcelStatusHandler,
};
