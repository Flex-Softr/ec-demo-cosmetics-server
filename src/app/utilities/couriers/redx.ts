import httpStatus from "http-status";

import config from "../../config/config";
import ApiError from "../../errorHandlers/ApiError";
import { TShippingMethod } from "../../modules/courier/courier.interface";
import {
  TRedXDeliveryArea,
  TRedXRequestBody,
  TRedxResponse,
} from "../../types/redx";
import {
  TSchedulePickRequestBody,
  TSchedulePickResponse,
} from "../../types/schedulePickup";

const redxApi = async (configData: {
  credentials: TShippingMethod["credentials"];
  endpoints: string;
  data?: Record<string, unknown>;
  method: "GET" | "POST";
}) => {
  const { credentials, method, data, endpoints } = configData;
  const API_ACCESS_TOKEN = credentials?.find(
    (cr) => cr.key === "API-ACCESS-TOKEN"
  )?.value;

  if (!API_ACCESS_TOKEN) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "RedX API credentials missing"
    );
  }

  let url = `https://sandbox.redx.com.bd/v1.0.0-beta${endpoints}`;
  if (config.env === "production") {
    url = `https://openapi.redx.com.bd/v1.0.0-beta${endpoints}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "API-ACCESS-TOKEN": `Bearer ${API_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: data && method === "POST" ? JSON.stringify(data) : undefined,
    });

    const responseData = await res.json();
    if (!res.ok) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        (responseData as { message: string }).message || "RedX API error"
      );
    }

    return responseData;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    const error = err as Error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "RedX API error occurred."
    );
  }
};

export const redxDeliveryArea = async (shippingMethod: TShippingMethod) => {
  const data = (await redxApi({
    credentials: shippingMethod.credentials,
    endpoints: "/areas",
    method: "GET",
  })) as { areas: TRedXDeliveryArea[] };

  return data.areas;
};

export const schedulePickOnRedx = async (
  shippingMethod: TShippingMethod,
  payload: TSchedulePickRequestBody
): Promise<TSchedulePickResponse> => {
  if (!payload.delivery_area)
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Delivery area is required."
    );

  if (!payload.delivery_area_id)
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Delivery area ID is required."
    );

  if (!payload.parcel_weight)
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Parcel weight is required."
    );

  if (!payload.value)
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, "Value is required.");

  const body: TRedXRequestBody = {
    customer_name: payload.full_name,
    customer_address: payload.full_address,
    customer_phone: payload.phone,
    cash_collection_amount: payload.cod_amount,
    delivery_area: payload.delivery_area ?? "N/A",
    delivery_area_id: payload.delivery_area_id ?? 0,
    parcel_weight: payload.parcel_weight ?? "N/A",
    value: payload.value ?? "N/A",
    merchant_invoice_id: payload.invoice_id,
  };

  const data = (await redxApi({
    credentials: shippingMethod?.credentials,
    endpoints: "/parcel",
    method: "POST",
    data: body,
  })) as TRedxResponse;

  return {
    success: !!data.tracking_id,
    tracking_code: data.tracking_id,
    message: data.tracking_id
      ? "Courier booked successfully"
      : "Failed to book courier",
    status: data.tracking_id ? "pickup-pending" : "",
  };
};
