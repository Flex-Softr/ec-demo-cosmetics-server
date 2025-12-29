import { z } from "zod";

const sliderSection = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Slider name is required!" }),
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
  }),
});

const updateSliderSection = z.object({
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
  }),
});

export const SliderSectionValidation = {
  sliderSection,
  updateSliderSection,
};
