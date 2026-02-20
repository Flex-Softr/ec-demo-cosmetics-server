import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import { redxDeliveryArea } from "../../utilities/couriers/redx";
import { decrypt, encrypt } from "../../utilities/encryptAndDecryptDBPass";
import {
  TShippingMethod,
  TShippingMethodCredential,
} from "./courier.interface";
import { Courier } from "./courier.model";

const getAllCouriersFromDB = async () => {
  const result = await Courier.find()
    .populate("thumb")
    .sort({ created_at: "asc" });

  // Transform result to match desired output
  const transformedResult = result.map((r) => {
    const courierObj = r.toObject();

    // Handle credentials decryption
    const credentials = (courierObj.credentials as TShippingMethodCredential[])
      ?.map((cred) => {
        if (cred.need_to_hash && cred.value) {
          return { ...cred, value: cred.value ? decrypt(cred.value) : "" };
        }
        return cred;
      })
      .filter((cred) => cred.is_optional !== true); // hide optional credentials like access tokens if needed, but per requirement "hide optional credentials like access tokens"

    return {
      ...courierObj,
      credentials,
    };
  });

  return transformedResult;
};

const updateCourierIntoDB = async (
  id: string,
  payload: Partial<TShippingMethod>
) => {
  const courier = await Courier.findById(id);

  if (!courier) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shipping method not found");
  }

  // Parse existing credentials (handling Mongoose array types)
  const existingCredentials = (courier.credentials ??
    []) as TShippingMethodCredential[];

  // User input credentials (may be partial)
  const inputCredentials = payload.credentials ?? [];

  // If setting to active -> validate required fields
  if (payload.isActive) {
    for (const field of existingCredentials) {
      const input = inputCredentials.find((c) => c.key === field.key);
      if (!field.is_optional) {
        if (input && !input.value) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Required field "${field.key}" cannot be empty`
          );
        }
      }
    }
  }

  const mergedCredentials = courier?.credentials?.map((field) => {
    const input = inputCredentials.find((c) => c.key === field.key);
    if (!input) return field;

    let finalValue = input.value;

    if (field.need_to_hash && input.value) {
      if (input.value === "") {
        finalValue = "";
      } else {
        finalValue = encrypt(input.value);
      }
    }

    field.value = finalValue; // mutate subdoc directly
    return field;
  });

  // Handle manual merge of credentials to preserve encryption
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { credentials: _credentials, ...restPayload } = payload;
  Object.assign(courier, restPayload);
  courier.credentials = mergedCredentials;

  await courier.save();
  return courier;
};

const getCourierByIdFromDB = async (id: string) => {
  const result = await Courier.findById(id).populate("thumb");
  return result;
};

const getRedxDeliveryArea = async () => {
  const shippingMethod = await Courier.findOne({ slug: "redx" });
  if (!shippingMethod)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to retrieve delivery area.",
      "Shipping method not found."
    );
  const data = await redxDeliveryArea(shippingMethod);
  return data;
};

export const CourierServices = {
  getAllCouriersFromDB,
  getCourierByIdFromDB,
  updateCourierIntoDB,
  getRedxDeliveryArea,
};
