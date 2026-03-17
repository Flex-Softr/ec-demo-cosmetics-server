import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import { TShippingMethod } from "../../modules/courier/courier.interface";
import {
  TSchedulePickRequestBody,
  TSchedulePickResponse,
} from "../../types/schedulePickup";
import {
  TSteadfastRequestBody,
  TSteadfastResponse,
} from "../../types/steadfast";

const steadfastApi = async (config: {
  credentials: TShippingMethod["credentials"];
  endpoints: string;
  data?: Record<string, unknown>;
  method: "GET" | "POST";
}) => {
  const { credentials, endpoints, data, method } = config;

  const API_KEY = credentials?.find((cr) => cr.key === "Api-Key")?.value;
  const SECRET_KEY = credentials?.find((cr) => cr.key === "Secret-Key")?.value;

  // ⭐ Update base URL if needed:
  const url = `https://portal.packzy.com/api/v1${endpoints}`;
  // const url = `https://portal.steadfast.com.bd/api/v1${endpoints}`;

  if (!API_KEY || !SECRET_KEY) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Steadfast API credentials missing"
    );
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Api-Key": API_KEY,
        "Secret-Key": SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: data && method === "POST" ? JSON.stringify(data) : undefined,
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        responseData?.message || "Courier booking failed."
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

const steadfast = async (
  shippingMethod: TShippingMethod,
  payload: TSchedulePickRequestBody
): Promise<TSchedulePickResponse> => {
  const body: TSteadfastRequestBody = {
    invoice: payload.invoice_id,
    recipient_name: payload.full_name,
    recipient_address: payload.full_address,
    recipient_phone: payload.phone,
    cod_amount: Number(payload.cod_amount),
    note: payload.note,
  };

  const data = (await steadfastApi({
    credentials: shippingMethod?.credentials,
    endpoints: "/create_order",
    method: "POST",
    data: body,
  })) as TSteadfastResponse;

  return {
    success: !!data?.consignment?.consignment_id,
    tracking_code: data?.consignment?.consignment_id?.toString(),
    message: data?.status === 200 ? "Success" : data?.message,
  };
};

export default steadfast;
