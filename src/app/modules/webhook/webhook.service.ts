import { Request } from "express";
import httpStatus from "http-status";
import config from "../../config/config";
import ApiError from "../../errorHandlers/ApiError";
import { TPathaoWebhookResponse } from "../../types/pathao";
import { TRedXWebhookResponse } from "../../types/redx";
import { TSteadfastWebhookResponse } from "../../types/steadfast";
import { Order } from "../orderManagement/order/order.model";
import { TShippingMethodSlug } from "./webhook.interface";

const parcelStatusHandler = async (req: Request) => {
  const provider = req.params.provider as TShippingMethodSlug;
  const payload = req.body as
    | TRedXWebhookResponse
    | TPathaoWebhookResponse
    | TSteadfastWebhookResponse;

  let token: string | undefined;

  const validProviders: TShippingMethodSlug[] = ["steadfast", "redx", "pathao"];

  if (!validProviders.includes(provider)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid provider.");
  }

  const updatedData: {
    tracking_id: string;
    status: string | undefined;
    shipping_status: string;
    message: string | undefined;
  } = {
    tracking_id: "",
    status: undefined,
    shipping_status: "",
    message: "",
  };
  let statusCode: number = httpStatus.OK;
  let query: Record<string, string> = {};
  if (provider === "steadfast") {
    token = req.headers["authorization"]?.split("Bearer ")[1];
    const data = payload as TSteadfastWebhookResponse;
    query = { orderId: data?.invoice };
    updatedData.tracking_id = data?.consignment_id?.toString();
    updatedData.status = data?.status === "delivered" ? "completed" : undefined;
    updatedData.message = data?.tracking_message;
    updatedData.shipping_status = data?.status?.replace(/_/g, " ");
  } else if (provider === "redx") {
    token = (
      Array.isArray(req.query?.token) ? req.query?.token[0] : req.query?.token
    )?.toString();
    const data = payload as TRedXWebhookResponse;
    updatedData.tracking_id = data?.tracking_number;
    updatedData.status = data?.status === "delivered" ? "completed" : undefined;
    updatedData.message = data?.message_bn;
    updatedData.shipping_status = data?.status?.replace(/-/g, " ");
  } else if (provider === "pathao") {
    statusCode = httpStatus.ACCEPTED;
    const tokenHeader = req.headers["x-pathao-signature"];
    token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
    const data = payload as TPathaoWebhookResponse;
    query = { "courierDetails.trackingId": data?.consignment_id };
    const event = data?.event?.split(".")[1];
    updatedData.tracking_id = data?.consignment_id;
    updatedData.status = event === "delivered" ? "completed" : undefined;
    updatedData.message = data?.reason;
    updatedData.shipping_status = event?.replace(/-/g, " ");
  }

  const existingToken = config.webhook_secret;

  if (!existingToken) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Webhook secret is not configured."
    );
  }

  if (token !== existingToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid webhook secret.");
  }

  if (Object.keys(query)?.length) {
    await Order.updateMany(query, {
      status: updatedData.status,
      statusFromShippingProvider: updatedData.shipping_status,
      messageFromShippingProvider: updatedData.message,
    });
  }

  return {
    status: "success",
    message: "Webhook received successfully.",
    statusCode,
  };
};

export const WebhookService = {
  parcelStatusHandler,
};
