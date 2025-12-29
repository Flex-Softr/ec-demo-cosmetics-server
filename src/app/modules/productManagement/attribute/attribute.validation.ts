import { z } from "zod";

export const attribute = z.object({
  body: z.object({
    name: z.string().trim().min(1, { message: "Attribute name is required!" }),
    values: z
      .array(
        z.object({
          name: z.string(),
        })
      )
      .min(1, { message: "Attribute values are required!" }),
    isActive: z.boolean().optional(),
  }),
});

export const updateAttribute = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: "Attribute name is required!" })
      .optional(),
    values: z
      .array(
        z.object({
          name: z.string().min(1, { message: "Attribute value is required!" }),
        })
      )
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

export const AttributeValidation = {
  attribute,
  updateAttribute,
};
