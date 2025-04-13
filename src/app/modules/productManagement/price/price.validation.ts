import { z } from "zod";

const price = z.object({
  regularPrice: z.number().min(1, { message: "Regular price is required!" }),
  salePrice: z.number().min(0).optional(),
  discountPercent: z.number().min(0).optional(),
  // date: z
  //   .object({
  //     start: z.string().min(1, { message: "Start date is required!" }),
  //     end: z.string().min(1, { message: "End date is required!" }),
  //   })
  //   .optional(),
});

const updatePrice = z.object({
  regularPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  discountPercent: z.number().min(0).optional(),
  date: z
    .object({
      start: z.string().min(1, { message: "Start date is required!" }),
      end: z.string().min(1, { message: "End date is required!" }),
    })
    .optional(),
});

export const PriceValidation = {
  price,
  updatePrice,
};
