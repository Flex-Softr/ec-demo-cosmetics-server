import { z } from "zod";
import { seoValidationSchema } from "../../seo/seo.validation";

const createBlogQATopicSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).trim(),
    slug: z.string({ required_error: "Slug is required" }).trim().toLowerCase(),
    category: z.string({ required_error: "Category is required" }),
    description: z.string().optional(),
    seo: seoValidationSchema.optional(),
    status: z.enum(["active", "inactive"]).default("active"),
  }),
});

const updateBlogQATopicSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    slug: z.string().trim().toLowerCase().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    seo: seoValidationSchema.optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const BlogQATopicValidation = {
  createBlogQATopicSchema,
  updateBlogQATopicSchema,
};
