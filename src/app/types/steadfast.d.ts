export type TSteadfastRequestBody = {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
};

export type TSteadfastResponse = {
  status: number;
  message: string;
  consignment: TSteadfastConsignmentResponse;
};

export type TSteadfastConsignmentResponse = {
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_email: string | null;
  alternative_phone: string | null;
  item_description: string | null;
  total_lot: number;
  cod_amount: number;
  status: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type TSteadfastWebhookNotificationType =
  | "tracking_update"
  | "delivery_status";

export type TSteadfastParcelStatus =
  | "pending"
  | "delivered"
  | "partial_delivered"
  | "cancelled"
  | "unknown";

export type TSteadfastWebhookResponse = {
  notification_type: TSteadfastWebhookNotificationType;
  consignment_id: number;
  invoice: string;
  cod_amount?: number;
  status?: TSteadfastParcelStatus | string;
  delivery_charge?: number;
  tracking_message: string;
  updated_at: string;
};
