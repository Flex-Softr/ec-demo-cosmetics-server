import config from "../config/config";
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
    refund_event_secret: config.refund_event_secret,
  };

  const secret = config.refund_event_secret;
  const trackingBaseUrl = config.tracking_server_api_url;

  if (!secret || !trackingBaseUrl) {
    logger.error(
      "REFUND_EVENT_SECRET or TRACKING_SERVER_API_URL is not defined"
    );
    return;
  }

  fetch(`${trackingBaseUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  }).catch((_error) => {});
};

export default triggerRefundEvent;
