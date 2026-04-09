import config from "../config/config";
import { logger } from "./logger";

const triggerCancelEvent = (orderId: string) => {
  const body = {
    event_name: "purchase_cancel",
    order_id: orderId,
    event_secret: config.event_secret,
  };

  const secret = config.event_secret;
  const trackingBaseUrl = config.tracking_server_api_url;

  if (!secret || !trackingBaseUrl) {
    logger.error(
      "CANCEL_EVENT_SECRET or TRACKING_SERVER_API_URL is not defined"
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

export default triggerCancelEvent;
