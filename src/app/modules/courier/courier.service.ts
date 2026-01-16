import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
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
          return { ...cred, value: decrypt(cred.value) };
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
  const { thumb_id, ...rest } = payload;

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

  // Merge credentials: keep old ones, update values
  const mergedCredentials = existingCredentials.map((field) => {
    const input = inputCredentials.find((c) => c.key === field.key);

    if (!input) return field; // no update for this key

    let finalValue = input.value;

    // Hash value if needed
    if (field.need_to_hash && input.value) {
      finalValue = encrypt(input.value);
    }

    return {
      ...field,
      value: finalValue,
    };
  });

  // Prepare final update object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    ...rest,
    credentials: mergedCredentials,
  };

  if (thumb_id) {
    updateData.thumb = thumb_id;
  }
  // If thumb_id is explicitly null (removing image)
  if (thumb_id === null) {
    updateData.thumb = null;
  }

  const result = await Courier.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return result;
};

const getCourierByIdFromDB = async (id: string) => {
  const result = await Courier.findById(id).populate("thumb");
  return result;
};

export const CourierServices = {
  getAllCouriersFromDB,
  getCourierByIdFromDB,
  updateCourierIntoDB,
};
