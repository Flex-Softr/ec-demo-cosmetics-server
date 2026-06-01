import { z } from "zod";

const createBlogQATagSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).trim(),
    slug: z.string({ required_error: "Slug is required" }).trim().toLowerCase(),
    status: z.enum(["active", "inactive"]).default("active"),
  }),
});

const updateBlogQATagSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    slug: z.string().trim().toLowerCase().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const BlogQATagValidation = {
  createBlogQATagSchema,
  updateBlogQATagSchema,
};
