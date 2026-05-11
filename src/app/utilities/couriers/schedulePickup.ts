import { TShippingMethod } from "../../modules/courier/courier.interface";
import {
  TSchedulePickRequestBody,
  TSchedulePickResponse,
} from "../../types/schedulePickup";

import { schedulePickOnPathao } from "./pathao";
import { schedulePickOnRedx } from "./redx";
import { schedulePickOnSteadfast } from "./steadfast";
import { schedulePickOnPaperfly } from "./paperfly";

export const schedulePickup = async (
  shippingMethod: TShippingMethod,
  payload: TSchedulePickRequestBody
): Promise<TSchedulePickResponse> => {
  if (shippingMethod.slug === "steadfast") {
    const result = await schedulePickOnSteadfast(shippingMethod, payload);
    return result;
  } else if (shippingMethod.slug === "redx") {
    const result = await schedulePickOnRedx(shippingMethod, payload);
    return result;
  } else if (shippingMethod.slug === "pathao") {
    const result = await schedulePickOnPathao(shippingMethod, payload);
    return result;
  } else if (shippingMethod.slug === "paperfly") {
    const result = await schedulePickOnPaperfly(shippingMethod, payload);
    return result;
  }
  throw new Error(`Unsupported shipping method: ${shippingMethod.slug}`);
};
