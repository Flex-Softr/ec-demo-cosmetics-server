import { z } from "zod";

import { validateDateInput } from "../../../utilities/validateDateInput";
import { paymentZodSchema } from "../orderPayment/orderPayment.validation";
import { shippingValidationZodSchema } from "../shipping/shipping.validation";
import { orderSources, orderStatus } from "./order.const";

const validateOrderIds = () =>
  z
    .string({ required_error: "Order ids is required" })
    .array()
    .nonempty({ message: "Can't be empty" });

const createOrderValidation = z.object({
  body: z
    .object({
      payment: paymentZodSchema,
      shippingCharge: z.string({
        required_error: "Shipping charge id is required",
      }),
      shipping: shippingValidationZodSchema(true),
      orderSource: z.object(
        {
          name: z.enum([...orderSources] as [string, ...string[]], {
            required_error: "Source name is required.",
          }),
          url: z.string().optional(),
          lpNo: z.string().optional(),
        },
        { required_error: "Some value from order source is required." }
      ),
      orderedProducts: z
        .object({
          quantity: z.number(),
          product: z.string(),
          variation: z.string().optional(),
        })
        .array()
        .optional(),
      custom: z.boolean().optional(),
      salesPage: z.boolean().optional(),
      advance: z.number().optional(),
      discount: z.number().optional(),
      orderNotes: z.string().optional(),
      officialNotes: z.string().optional(),
      invoiceNotes: z.string().optional(),
      courierNotes: z.string().optional(),
      coupon: z.string().optional(),
    })
    .refine(
      (data) => {
        // If either custom or salesPage is true, orderedProducts should be present
        return (
          (!data?.custom && !data?.salesPage) ||
          data?.orderedProducts?.length ||
          0 > 0
        );
      },
      {
        message:
          "Ordered products are required when the order is either custom or from the sales page",
        path: ["orderedProducts"],
      }
    ),
});

const getOrdersAdmin = z.object({
  query: z.object({
    startFrom: z.string().optional(),
    endAt: z.string().optional(),
    phoneNumber: z.string().optional(),
    status: z.string().optional(),
    sort: z.string().optional(),
    limit: z.string().optional(),
    page: z.string().optional(),
  }),
});

const updateOrderStatus = z.object({
  body: z.object({
    status: z.enum([...orderStatus] as [string, ...string[]], {
      required_error: "Status is required",
    }),
    message: z.string().optional(),
    orderIds: validateOrderIds(),
  }),
});
const updateProcessingStatus = z.object({
  body: z.object({
    status: z.enum([...orderStatus] as [string, ...string[]], {
      required_error: "Status is required",
    }),
    orderIds: validateOrderIds(),
  }),
});
const bookCourierAndUpdateStatus = z.object({
  body: z.object({
    status: z.enum([...orderStatus] as [string, ...string[]], {
      required_error: "Status is required",
    }),
    orderIds: validateOrderIds(),
    // courierProvider: z.string({
    //   required_error: "Courier provider is required",
    // }),
  }),
});

const orderedProductsSchema = () =>
  z.object({
    id: z.string().optional(),
    product: z.string().optional(),
    variation: z.string().optional(),
    isWarrantyClaim: z.boolean().optional(),
    quantity: z.number().optional(),
    claimedCodes: z
      .array(
        z.object({
          code: z.string({ required_error: "Code is required" }),
        })
      )
      .optional(),
  });

const updateOrderDetailsByAdmin = z.object({
  body: z.object({
    discount: z.number().min(0).optional(),
    advance: z.number().min(0).optional(),
    officialNotes: z.string().optional(),
    invoiceNotes: z.string().optional(),
    courierNotes: z.string().optional(),
    reasonNotes: z.string().optional(),
    monitoringNotes: z.string().optional(),
    shipping: shippingValidationZodSchema(true).optional(),
    followUpDate: validateDateInput().optional(),
    orderedProducts: z.array(orderedProductsSchema()).optional(),
    attributes: z
      .array(
        z.object({
          name: z.string({ required_error: "Name is required." }),
          value: z.string({ required_error: "Value is required." }),
        })
      )
      .optional(),
    status: z.string().optional(),
    payment: paymentZodSchema.optional(),
  }),
});

const deleteOrders = z.object({
  body: z.object({
    orderIds: validateOrderIds(),
  }),
});

const updateQuantity = z.object({
  body: z.object({
    orderedItemId: z.string({ required_error: "Ordered item id is required." }),
    quantity: z.number({ required_error: "New quantity is required." }),
  }),
});

const schedulePickup = z.object({
  body: z.object({
    order_id: z.string({ required_error: "Order id is required" }),
    shipping_method_id: z.string({
      required_error: "Shipping method id is required",
    }),
    delivery_area: z.string().optional(),
    delivery_area_id: z.number().optional(),
    parcel_weight: z.string().optional(),
    value: z.string().optional(),
    item_quantity: z.number().optional(),
    store_id: z.number().optional(),
  }),
});

const bulkSchedulePickup = z.object({
  body: z.object({
    order_ids: z.string().array(),
    shipping_method_id: z.string(),
  }),
});

export type TSchedulePickup = z.infer<typeof schedulePickup>;

export const OrderValidation = {
  createOrderValidation,
  getOrdersAdmin,
  updateOrderStatus,
  updateProcessingStatus,
  bookCourierAndUpdateStatus,
  updateOrderDetailsByAdmin,
  deleteOrders,
  updateQuantity,
  schedulePickup,
  bulkSchedulePickup,
};
