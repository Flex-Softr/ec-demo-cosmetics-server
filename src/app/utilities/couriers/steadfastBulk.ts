import { TCourier } from "../../modules/courier/courier.interface";
import { TOrderDataForCourier } from "../../modules/orderManagement/order/order.utils";
import formatShippingAddress from "../formatShippingAddress";
import { steadfastApi } from "./steadfast";

export type TCourierResponse = {
  invoice: string;
  tracking_code: string;
  status: string;
  message?: string;
};

/**
 * Bulk order creation for Steadfast.
 */
export const schedulePickOnSteadfastBulk = async (
  orders: TOrderDataForCourier[],
  courier: TCourier
) => {
  const payload = orders.map(
    ({ orderId, shippingData, total, courierNotes }) => ({
      invoice: orderId,
      recipient_name: shippingData.fullName,
      recipient_address: formatShippingAddress(shippingData),
      recipient_phone: shippingData.phoneNumber,
      cod_amount: total,
      note: courierNotes || "",
    })
  );

  const { data } = await steadfastApi({
    credentials: courier?.credentials || [],
    endpoints: "/create_order/bulk-order",
    method: "POST",
    payload: payload,
  });

  const sanitizedData = (data as TCourierResponse[]).map(
    ({ invoice, tracking_code, status, message }) => ({
      orderId: invoice,
      trackingId: tracking_code,
      status,
      message,
    })
  );

  return {
    success: sanitizedData.filter((item) => item.status === "success"),
    error: sanitizedData.filter((item) => item.status === "error"),
  };
};

export default schedulePickOnSteadfastBulk;
