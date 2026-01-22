import { z } from "zod";

const createHomepageSection = z.object({
  body: z.object({
    title: z.string().optional(),
    subtitle: z.string({ required_error: "Subtitle is required!" }),
    collectionId: z.string({ required_error: "Collection ID is required!" }),
  }),
});

const updateHomepageSection = z.object({
  body: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    collectionId: z.string().optional(),
    limit: z.number().optional(),
    sortOrder: z.number().optional(),
  }),
});

export const HomepageSectionValidation = {
  createHomepageSection,
  updateHomepageSection,
};
