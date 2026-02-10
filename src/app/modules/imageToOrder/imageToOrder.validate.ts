import { z } from "zod";
import { paymentZodSchema } from "../orderManagement/orderPayment/orderPayment.validation";
import { shippingValidationZodSchema } from "../orderManagement/shipping/shipping.validation";
import { ImageToOrderConst } from "./imageToOrder.const";

const createReq = z.object({
  body: z.object({
    shipping: shippingValidationZodSchema(true),
    customerNotes: z.string().optional(),
  }),
});

const updateRequest = z.object({
  body: z.object({
    contactStatus: z
      .enum([...ImageToOrderConst.contactStatusEnum] as [string, ...string[]])
      .optional(),
    status: z
      .enum([...ImageToOrderConst.statusEnum] as [string, ...string[]])
      .optional(),
  }),
});

const createOrder = z.object({
  body: z.object({
    payment: paymentZodSchema,
    shippingCharge: z.string({
      required_error: "Shipping charge id is required",
    }),
    shipping: shippingValidationZodSchema(true),
    orderedProducts: z
      .object({
        quantity: z.number(),
        product: z.string(),
        variation: z.string().optional(),
      })
      .array()
      .refine((items) => items.length > 0, {
        message: "Ordered products cannot be empty",
      }),
    advance: z.number().optional(),
    discount: z.number().optional(),
    orderNotes: z.string().optional(),
    officialNotes: z.string().optional(),
    invoiceNotes: z.string().optional(),
    courierNotes: z.string().optional(),
    coupon: z.string().optional(),
  }),
});

export const ImageToOrderValidate = {
  createReq,
  updateRequest,
  createOrder,
};
