export type TDashboardSummary = {
  orders: number;
  sales: number;
  products: number;
  customers: number;
};

export type TOrderStatusCount = {
  status: string;
  status_formatted: string;
  count: number;
};

export type TOrdersSummary = {
  today_order_value: string;
  week_order_value: string;
  month_order_value: string;
  total_orders_count: string;
  avg_order_value: string;
  total_order_value: string;
};

export type TOrderReportItem = {
  date: string;
  count: number;
};

export type TOrderReportFilter = "daily" | "weekly" | "monthly" | "yearly";

export type TTopCustomer = {
  customer_id: string;
  order_count: number;
  customer: {
    name: string | null;
    phone: string | null;
  } | null;
};

export type TRecentOrder = {
  id: string;
  invoice_no: string;
  status: string;
  grand_total: number;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: Date;
};
