export type TPathaoRequestBody = {
  store_id: number;
  merchant_order_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_type: number;
  item_type: 1 | 2;
  special_instruction?: string | null;
  item_quantity: number;
  item_weight: string;
  amount_to_collect: number;
};

export type TPathaoResponse = {
  message: string;
  type: string;
  code: string;
  data: {
    consignment_id: string;
    merchant_order_id: string;
    order_status: string;
    delivery_fee: string;
  };
};

export type TPathaoWebhookEvent =
  | "order.created"
  | "order.updated"
  | "order.pickup-requested"
  | "order.assigned-for-pickup"
  | "order.picked"
  | "order.pickup-failed"
  | "order.pickup-cancelled"
  | "order.at-the-sorting-hub"
  | "order.in-transit"
  | "order.received-at-last-mile-hub"
  | "order.assigned-for-delivery"
  | "order.delivered"
  | "order.partial-delivery"
  | "order.returned"
  | "order.delivery-failed"
  | "order.on-hold"
  | "order.paid"
  | "order.paid-return"
  | "order.exchanged"
  | "store.created"
  | "store.updated";

export type TPathaoWebhookResponse = {
  consignment_id: string;
  merchant_order_id: string;
  updated_at: string;
  timestamp: string;
  store_id: number;
  store_name?: string;
  store_address?: string;
  is_active?: number;
  event: TPathaoWebhookEvent;
  delivery_fee?: number;
  reason?: string;
};
