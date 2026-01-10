import { z } from "zod";

const createCollection = z.object({
  body: z.object({
    title: z.string().trim().min(1, { message: "Title is required!" }),
    slug: z.string().trim().optional(),
    image: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
  }),
});

const updateCollection = z.object({
  body: z.object({
    title: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    image: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
  }),
  sortOrder: z.number().optional(),
});

export const CollectionValidation = {
  createCollection,
  updateCollection,
};
