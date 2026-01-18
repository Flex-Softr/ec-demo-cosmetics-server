import { hashUserData } from "./hash256";
import { logger } from "./logger";

const triggerRefundEvent = (data: {
  ph?: string;
  em?: string;
  value: number;
  contents?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  orderId?: string;
}) => {
  const body = {
    event: "refund",
    ph: hashUserData(data.ph),
    em: hashUserData(data.em),
    value: data.value,
    currency: "BDT",
    contents: data.contents,
    content_type: "product",
    order_id: data.orderId,
    refund_event_secret: process.env.REFUND_EVENT_SECRET,
  };

  const secret = process.env.REFUND_EVENT_SECRET;
  const trackingBaseUrl = process.env.TRACKING_BASE_URL;

  if (!secret || !trackingBaseUrl) {
    logger.error("REFUND_EVENT_SECRET or TRACKING_BASE_URL is not defined");
    return;
  }

  fetch(`${trackingBaseUrl}/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  }).catch((_error) => {});
};

export default triggerRefundEvent;
