export type TRedXDeliveryArea = {
  id: number;
  name: string;
  post_code: number;
  district_name: string;
  division_name: string;
  zone_id: number;
};

export type TRedXRequestBody = {
  customer_name: string;
  customer_phone: string;
  delivery_area: string;
  delivery_area_id: number;
  customer_address: string;
  cash_collection_amount: string;
  merchant_invoice_id: string;
  parcel_weight: string;
  value: string; // the actual price of the parcel
};

export type TRedxResponse = {
  tracking_id: string;
};

export type TRedXParcelStatus =
  | "ready-for-delivery"
  | "delivery-in-progress"
  | "delivered"
  | "agent-hold"
  | "agent-returning"
  | "returned"
  | "agent-area-change";

export type TRedXWebhookResponse = {
  tracking_number: string;
  timestamp: string;
  status: TRedXParcelStatus;
  message_en: string;
  message_bn: string;
  invoice_number: string;
};
