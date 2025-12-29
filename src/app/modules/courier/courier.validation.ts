import { z } from "zod";

const createCourier = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    // image: z.string({ required_error: "Image is required" }),
    // website: z.string().optional(),
    apiBaseUrl: z.string().optional(),
    apiKey: z.string().optional(),
    secretKey: z.string().optional(),
    credentials: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateCourier = createCourier.deepPartial();

export const CourierValidation = {
  createCourier,
  updateCourier,
};
