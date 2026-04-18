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
import { TSteadfastRequestBody } from "../../types/steadfast";

/**
 * Generic Steadfast API wrapper that handles both single and bulk requests.
 */
export const steadfastApi = async (config: {
  credentials: TShippingMethodCredential[];
  endpoints: string;
  payload?: Record<string, unknown> | Record<string, unknown>[];
  method: "GET" | "POST";
}) => {
  const { credentials, endpoints, payload, method } = config;

  const API_KEY = credentials?.find((cr) => cr.key === "Api-Key")?.value;
  const SECRET_KEY = credentials?.find((cr) => cr.key === "Secret-Key")?.value;

  if (!API_KEY || !SECRET_KEY) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Steadfast API credentials missing"
    );
  }

  const url = `https://portal.packzy.com/api/v1${endpoints}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Api-Key": API_KEY,
        "Secret-Key": SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: payload && method === "POST" ? JSON.stringify(payload) : undefined,
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        responseData?.message || "Steadfast API request failed."
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
      error.message || "Steadfast API error occurred."
    );
  }
};

/**
 * High-level pickup scheduling action for Steadfast.
 */
export const schedulePickOnSteadfast = async (
  shippingMethod: TShippingMethod,
  payload: TSchedulePickRequestBody
): Promise<TSchedulePickResponse> => {
  const body: TSteadfastRequestBody = {
    invoice: payload.invoice_id,
    recipient_name: payload.full_name,
    recipient_address: payload.full_address,
    recipient_phone: payload.phone,
    cod_amount: Number(payload.cod_amount),
    note: payload.note || "",
  };

  const response = (await steadfastApi({
    credentials: (shippingMethod?.credentials ||
      []) as TShippingMethodCredential[],
    endpoints: "/create_order",
    method: "POST",
    payload: body,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any;

  // Handle both wrapped { data: { ... } } and unwrapped { ... } responses
  const data = response?.data || response;
  const consignment = data?.consignment || data;

  return {
    success: !!consignment?.consignment_id,
    tracking_code: consignment?.consignment_id?.toString(),
    message: data?.status === 200 ? "Success" : data?.message,
    status: consignment?.status,
  };
};

/**
 * Fetch current delivery status from Steadfast using invoice ID.
 */
export const getSteadfastStatusByInvoice = async (
  shippingMethod: TShippingMethod,
  invoiceId: string
): Promise<{ status: number; delivery_status: string }> => {
  const result = (await steadfastApi({
    credentials: (shippingMethod?.credentials ||
      []) as TShippingMethodCredential[],
    endpoints: `/status_by_invoice/${invoiceId}`,
    method: "GET",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any;

  const data = result?.data || result;

  return {
    status: data?.status || result?.status,
    delivery_status: data?.delivery_status,
  };
};

export default schedulePickOnSteadfast;
