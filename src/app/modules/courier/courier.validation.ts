import { z } from "zod";

const createCourier = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    slug: z.string().optional(),
    description: z.string().optional(),
    thumb_id: z.string().optional(),
    credentials: z
      .array(
        z.object({
          key: z.string(),
          value: z.string(),
          need_to_hash: z.boolean().optional(),
          is_optional: z.boolean().optional(),
        })
      )
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateCourier = createCourier.deepPartial();

export const CourierValidation = {
  createCourier,
  updateCourier,
};
