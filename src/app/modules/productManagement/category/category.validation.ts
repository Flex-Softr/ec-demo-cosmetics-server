import { z } from "zod";

const category = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Category name is required!" }),
    image: z.string().optional(),
    description: z.string().optional(),
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
    parent: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const CategoryValidation = {
  category,
  updateCategory,
};
