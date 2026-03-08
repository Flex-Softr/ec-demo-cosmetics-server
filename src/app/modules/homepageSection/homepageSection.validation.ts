import { z } from "zod";

const createHomepageSection = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required!" }),
    subtitle: z.string().optional(),
    collectionId: z.string({ required_error: "Collection ID is required!" }),
    limit: z.number().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateHomepageSection = z.object({
  body: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    collectionId: z.string().optional(),
    limit: z.number().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const HomepageSectionValidation = {
  createHomepageSection,
  updateHomepageSection,
};
