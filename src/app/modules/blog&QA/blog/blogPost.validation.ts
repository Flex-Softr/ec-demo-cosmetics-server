import { z } from "zod";
import { seoValidationSchema } from "../../seo/seo.validation";

const createBlogPostSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }).trim(),
    slug: z.string({ required_error: "Slug is required" }).trim().toLowerCase(),
    featuredImage: z.string().optional(),
    content: z.string({ required_error: "Content is required" }),
    excerpt: z.string().optional(),
    readTime: z.number().optional(),
    category: z.string({ required_error: "Category is required" }),
    tags: z.array(z.string()).optional(),
    author: z.string({ required_error: "Author is required" }),
    relatedBlogs: z.array(z.string()).optional(),
    seo: seoValidationSchema.optional(),
    status: z.enum(["draft", "published", "archived"]).default("draft"),
    publishedAt: z.string().datetime().optional(),
  }),
});

const updateBlogPostSchema = z.object({
  body: z.object({
    title: z.string().trim().optional(),
    slug: z.string().trim().toLowerCase().optional(),
    featuredImage: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    readTime: z.number().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    relatedBlogs: z.array(z.string()).optional(),
    seo: seoValidationSchema.optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    publishedAt: z.string().datetime().optional(),
  }),
});

export const BlogPostValidation = {
  createBlogPostSchema,
  updateBlogPostSchema,
};
