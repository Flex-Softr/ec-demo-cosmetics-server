import { z } from "zod";
import { seoValidationSchema } from "../../seo/seo.validation";

const category = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Category name is required!" }),
    image: z.string().optional(),
    description: z.string().optional(),
    seo: seoValidationSchema.optional(),
    parent: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateCategory = z.object({
  body: z.object({
    name: z.string().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
    seo: seoValidationSchema.optional(),
    parent: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const CategoryValidation = {
  category,
  updateCategory,
};
