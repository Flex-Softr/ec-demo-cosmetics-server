import { z } from "zod";

export const seoValidationSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  schemaMarkup: z.string().optional(),
});

export const productSeoValidationSchema = seoValidationSchema.extend({
  focusKeyphrase: z.string().optional(),
  slug: z.string().optional(),
});
