import { z } from "zod";

const createShippingCharge = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    description: z.string().optional(),
    amount: z.number({ required_error: "Shipping amount is required" }).min(0),
    isActive: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

const updateShippingCharge = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    amount: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const ShippingChargeValidation = {
  createShippingCharge,
  updateShippingCharge,
};
