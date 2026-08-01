import { z } from "zod";
import { orderStatus } from "../../orderManagement/order/order.const";
import { validateDateInput } from "../../../utilities/validateDateInput";

const dateFilters = z.object({
  from: validateDateInput({
    errorMessage: "Invalid 'from' date. Use YYYY-MM-DD format.",
  }).optional(),
  to: validateDateInput({
    errorMessage: "Invalid 'to' date. Use YYYY-MM-DD format.",
  }).optional(),
});

const pagination = z.object({
  page: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) > 0), {
      message: "page must be a positive number",
    }),
  limit: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) > 0), {
      message: "limit must be a positive number",
    }),
});

const summary = z.object({
  query: dateFilters,
});

const orders = z.object({
  query: dateFilters.merge(pagination).extend({
    order_status: z
      .string()
      .optional()
      .refine(
        (v) => !v || orderStatus.includes(v as (typeof orderStatus)[number]),
        {
          message: "Invalid order status",
        }
      ),
  }),
});

const byProduct = z.object({
  query: dateFilters.extend({
    product_id: z.string().optional(),
    category_id: z.string().optional(),
  }),
});

const byCategory = z.object({
  query: dateFilters.extend({
    category_id: z.string().optional(),
  }),
});

const payments = z.object({
  query: dateFilters.extend({
    method_id: z.string().optional(),
  }),
});

export const SalesValidation = {
  summary,
  orders,
  byProduct,
  byCategory,
  payments,
};
