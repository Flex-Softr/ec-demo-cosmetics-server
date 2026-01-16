export type TSchedulePickRequestBody = {
  invoice_id: string;
  full_name: string;
  full_address: string;
  phone: string;
  cod_amount: string;
  delivery_area?: string;
  delivery_area_id?: number;
  parcel_weight?: string;
  value?: string; // the actual price of the parcel
  store_id: number;
  item_quantity: number;
  note?: string;
};

export type TSchedulePickResponse = {
  success: boolean;
  tracking_code?: string;
};
