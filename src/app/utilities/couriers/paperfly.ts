/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import {
  TShippingMethod,
  TShippingMethodCredential,
} from "../../modules/courier/courier.interface";
import {
  TSchedulePickRequestBody,
  TSchedulePickResponse,
} from "../../types/schedulePickup";

/**
 * Generic Paperfly API wrapper.
 */
export const paperflyApi = async (config: {
  credentials: TShippingMethodCredential[];
  endpoints: string;
  payload?: Record<string, unknown>;
  method: "GET" | "POST";
  baseUrl?: string;
}) => {
  const { credentials, endpoints, payload, method, baseUrl } = config;

  const USERNAME = credentials?.find((cr) => cr.key === "username")?.value;
  const PASSWORD = credentials?.find((cr) => cr.key === "password")?.value;
  const PAPERFLY_KEY = credentials?.find(
    (cr) => cr.key === "paperflykey"
  )?.value;

  if (!USERNAME || !PASSWORD || !PAPERFLY_KEY) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Paperfly API credentials missing (username, password, or paperflykey)"
    );
  }

  const url = `${baseUrl || "https://api.paperfly.com.bd"}${endpoints}`;
  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        paperflykey: PAPERFLY_KEY,
        "Content-Type": "application/json",
      },
      body: payload && method === "POST" ? JSON.stringify(payload) : undefined,
    });
    const responseData = await res.json();
    if (!res.ok || responseData.response_code !== 200) {
      const errorMsg =
        responseData?.error?.message ||
        responseData?.message ||
        "Paperfly API request failed.";
      throw new ApiError(httpStatus.BAD_REQUEST, errorMsg);
    }

    return responseData;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    const error = err as Error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Paperfly API error occurred."
    );
  }
};

/**
 * High-level pickup scheduling action for Paperfly.
 */
export const schedulePickOnPaperfly = async (
  shippingMethod: TShippingMethod,
  payload: TSchedulePickRequestBody
): Promise<TSchedulePickResponse> => {
  const body = {
    merchantOrderReference: payload.invoice_id,
    storeName: "Siddikia Prokashoni", // Default store name, could be dynamic if needed
    productBrief: "Books", // Default product brief
    packagePrice: payload.cod_amount.toString(),
    max_weight: payload.parcel_weight || "0.5",
    customerName: payload.full_name,
    customerAddress: payload.full_address,
    customerPhone: payload.phone,
  };

  const response = (await paperflyApi({
    credentials: (shippingMethod?.credentials ||
      []) as TShippingMethodCredential[],
    endpoints: "/merchant/api/service/new_order_v2.php",
    method: "POST",
    payload: body,
  })) as any;

  const success = response?.success;

  return {
    success: !!success?.tracking_number,
    tracking_code: success?.tracking_number,
    message: success?.message || response?.message,
    status: response?.response_code === 200 ? "Success" : "Failed",
  };
};

/**
 * Fetch current delivery status from Paperfly using reference number.
 */
export const getPaperflyStatusByReference = async (
  shippingMethod: TShippingMethod,
  referenceNumber: string
): Promise<any> => {
  const result = (await paperflyApi({
    credentials: (shippingMethod?.credentials ||
      []) as TShippingMethodCredential[],
    endpoints: "/API-Order-Tracking",
    method: "POST",
    payload: {
      ReferenceNumber: referenceNumber,
    },
  })) as any;

  return result?.success?.trackingStatus?.[0] || result;
};

export default schedulePickOnPaperfly;
