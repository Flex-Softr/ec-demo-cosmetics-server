import { z } from "zod";

const bannerSlider = z.object({
  body: z.object({
    name: z.string().optional(),
    image: z.string().min(1, { message: "Image is required!" }),
    bannerLink: z
      .string()
      .optional()
      .refine(
        (value) =>
          value === undefined ||
          value === "" ||
          z.string().url().safeParse(value).success,
        {
          message: "Banner Link must be a valid URL or empty.",
        }
      ),
    isActive: z.boolean().default(true),
    sortOrder: z.number().optional(),
  }),
});

const updateBannerSlider = z.object({
  body: z.object({
    name: z.string().optional(),
    image: z.string().optional(),
    bannerLink: z
      .string()
      .optional()
      .refine(
        (value) =>
          value === undefined ||
          value === "" ||
          z.string().url().safeParse(value).success,
        {
          message: "Banner Link must be a valid URL or empty.",
        }
      ),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
  }),
});

export const BannerSliderValidation = {
  bannerSlider,
  updateBannerSlider,
};
