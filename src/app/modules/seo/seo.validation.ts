import { z } from "zod";

export const seoValidationSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().url().optional(),
  schemaMarkup: z.string().optional(),
});
