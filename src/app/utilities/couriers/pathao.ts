import axios, { AxiosError } from "axios";
import httpStatus from "http-status";

import config from "../../config/config";
import ApiError from "../../errorHandlers/ApiError";
import { TShippingMethod } from "../../modules/courier/courier.interface";
import { Courier } from "../../modules/courier/courier.model";
import { TPathaoRequestBody, TPathaoResponse } from "../../types/pathao";
import {
  TSchedulePickRequestBody,
  TSchedulePickResponse,
} from "../../types/schedulePickup";
import { decrypt } from "../encryptAndDecryptDBPass";

let base_url = "https://courier-api-sandbox.pathao.com";
if (config.env === "production") {
  base_url = "https://api-hermes.pathao.com";
}

const TOKEN_SAFETY_MARGIN_SECONDS = 60;

const isExpired = (expiresAt: Date) => {
  const now = Date.now();
  const withMargin = expiresAt.getTime() - TOKEN_SAFETY_MARGIN_SECONDS * 1000;
  return withMargin <= now;
};

const computeExpiresAt = (expires_in: number): Date => {
  const ms = expires_in * 1000;
  return new Date(Date.now() + ms);
};

const getAccessToken = async (
  credentials: TShippingMethod["credentials"]
): Promise<string> => {
  const client_id = credentials?.find((cr) => cr.key === "client_id")?.value;
  const client_secret = credentials?.find(
    (cr) => cr.key === "client_secret"
  )?.value;
  const username = credentials?.find((cr) => cr.key === "username")?.value;
  const password = credentials?.find((cr) => cr.key === "password")?.value;

  if (!client_id || !client_secret || !username || !password) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Operation failed.",
      "Pathao API credentials missing"
    );
  }

  try {
    const response = await axios.post(
      `${base_url}/aladdin/api/v1/issue-token`,
      {
        client_id,
        client_secret,
        grant_type: "password",
        username,
        password: decrypt(password),
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const { access_token, expires_in } = response?.data || {};

    if (!access_token) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve access token"
      );
    }

    const updatedCredentials = (credentials || []).filter(
      (cr) => cr.key !== "access_token" && cr.key !== "access_token_expires_in"
    );

    updatedCredentials.push({
      key: "access_token_expires_in",
      value: computeExpiresAt(expires_in).toISOString(),
      is_optional: true,
    });
    updatedCredentials.push({
      key: "access_token",
      value: access_token,
      is_optional: true,
    });

    await Courier.updateOne(
      { slug: "pathao" },
      { $set: { credentials: updatedCredentials } }
    );

    return access_token;
  } catch (err) {
    const error = err as AxiosError;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch courier access token",
      typeof error?.response?.data === "string"
        ? error.response.data
        : JSON.stringify(error?.response?.data) || error.message
    );
  }
};

export const pathaoApi = async (config: {
  credentials: TShippingMethod["credentials"];
  endpoints: string;
  data?: Record<string, unknown>;
  method: "GET" | "POST";
}) => {
  const { credentials, method, data, endpoints } = config;

  let access_token = credentials?.find(
    (cr) => cr.key === "access_token"
  )?.value;
  const access_token_expires_in = credentials?.find(
    (cr) => cr.key === "access_token_expires_in"
  )?.value;

  if (!access_token || isExpired(new Date(access_token_expires_in || ""))) {
    access_token = await getAccessToken(credentials);
  }

  const url = `${base_url}/aladdin/api/v1${endpoints}`;

  try {
    const token = `Bearer ${access_token.trim()}`;

    const response = await axios({
      method,
      url,
      data,
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const resData = response.data;

    return resData;
  } catch (err) {
    if (err instanceof AxiosError) {
      const error = (err as AxiosError).response?.data as {
        errors: TPathaoResponse;
        message: string;
      };
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        error.message,
        Object.values(error.errors ?? {})
          .flat()
          .join(", ")
      );
    }

    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Operation failed.",
      (err as Error).message
    );
  }
};

export const schedulePickOnPathao = async (
  shippingMethod: TShippingMethod,
  payload: TSchedulePickRequestBody
): Promise<TSchedulePickResponse> => {
  if (!payload.item_quantity)
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Failed to schedule pickup.",
      "Item quantity is required."
    );

  if (!payload.store_id)
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Failed to schedule pickup.",
      "Store ID is required."
    );

  if (!payload.parcel_weight)
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Failed to schedule pickup.",
      "Parcel weight is required."
    );

  if (isNaN(Number(payload.parcel_weight)))
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Failed to schedule pickup.",
      "Parcel weight must be a valid number."
    );

  const data: TPathaoRequestBody = {
    recipient_name: payload.full_name,
    recipient_phone: payload.phone,
    recipient_address: payload.full_address,
    amount_to_collect: Number(payload.cod_amount || 0),
    delivery_type: 48,
    item_type: 2,
    merchant_order_id: payload.invoice_id,
    item_weight: Number(payload.parcel_weight).toFixed(2),
    store_id: payload.store_id,
    item_quantity: payload.item_quantity,
  };
  const result = (await pathaoApi({
    credentials: shippingMethod.credentials,
    endpoints: "/orders",
    method: "POST",
    data,
  })) as TPathaoResponse;

  return { success: true, tracking_code: result?.data?.consignment_id };
};
