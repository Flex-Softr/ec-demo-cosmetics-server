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
    deliveryStatus: string | undefined;
  } = {
    tracking_id: "",
    status: undefined,
    shipping_status: "",
    message: "",
    deliveryStatus: undefined,
  };
  let statusCode: number = httpStatus.OK;
  let query: Record<string, string> = {};
  if (provider === "steadfast") {
    token = req.headers["authorization"]?.split("Bearer ")[1];
    const data = payload as TSteadfastWebhookResponse;
    query = { orderId: data?.invoice };
    updatedData.tracking_id = data?.consignment_id?.toString();

    const lowerStatus = data?.status?.toLowerCase();
    if (lowerStatus === "delivered") {
      updatedData.status = "completed";
    } else if (lowerStatus === "cancelled") {
      updatedData.status = "returned";
    } else if (lowerStatus === "partial_delivered") {
      updatedData.status = "partial completed";
    }

    updatedData.deliveryStatus = lowerStatus?.replace(/[_-]/g, " ");
    updatedData.message = data?.tracking_message;
  } else if (provider === "redx") {
    token = (
      Array.isArray(req.query?.token) ? req.query?.token[0] : req.query?.token
    )?.toString();
    const data = payload as TRedXWebhookResponse;
    query = { "courierDetails.trackingId": data?.tracking_number };
    updatedData.tracking_id = data?.tracking_number;

    const lowerStatus = data?.status?.toLowerCase();
    if (lowerStatus === "delivered") {
      updatedData.status = "completed";
    } else if (lowerStatus === "returned") {
      updatedData.status = "returned";
    }

    updatedData.deliveryStatus = lowerStatus?.replace(/[_-]/g, " ");
    updatedData.message = data?.message_bn;
  } else if (provider === "pathao") {
    statusCode = httpStatus.ACCEPTED;
    const tokenHeader = req.headers["x-pathao-signature"];
    token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
    const data = payload as TPathaoWebhookResponse;
    query = { orderId: data?.merchant_order_id };

    const event = data?.event?.split(".")?.[1]?.toLowerCase();
    if (event === "delivered") {
      updatedData.status = "completed";
    } else if (event === "returned" || event === "delivery-failed") {
      updatedData.status = "returned";
    } else if (event === "partial-delivery") {
      updatedData.status = "partial completed";
    }

    updatedData.tracking_id = data?.consignment_id;
    updatedData.deliveryStatus = event?.replace(/[_-]/g, " ");
    updatedData.message = data?.reason;
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
    const updateDoc: Record<string, string> = {};
    if (updatedData.status) updateDoc.status = updatedData.status;
    if (updatedData.deliveryStatus)
      updateDoc.deliveryStatus = updatedData.deliveryStatus;
    if (updatedData.message) updateDoc.deliveryMessage = updatedData.message;

    if (Object.keys(updateDoc).length > 0) {
      await Order.updateMany(query, updateDoc);
    }
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
