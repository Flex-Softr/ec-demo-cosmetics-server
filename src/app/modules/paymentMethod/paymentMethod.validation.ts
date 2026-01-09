import { z } from "zod";

const requiredInputValidationSchema = z.object({
  type: z.enum(["text", "number", "select"]),
  name: z.string({ required_error: "Input name is required" }),
  is_required: z.boolean().default(false),
  enums: z.string().optional(),
});

const createPaymentMethodValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    instructions: z.string().optional(),
    isActive: z.boolean().optional(),
    logo: z.string().optional(),
    sortOrder: z.number().optional(),
    required_inputs: z.array(requiredInputValidationSchema).default([]),
  }),
});

const updatePaymentMethodValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    instructions: z.string().optional(),
    isActive: z.boolean().optional(),
    logo: z.string().optional(),
    sortOrder: z.number().optional(),
    required_inputs: z.array(requiredInputValidationSchema).optional(),
  }),
});

export const PaymentMethodValidation = {
  createPaymentMethodValidationSchema,
  updatePaymentMethodValidationSchema,
};
