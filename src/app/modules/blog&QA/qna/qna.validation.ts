import { z } from "zod";
import { seoValidationSchema } from "../../seo/seo.validation";

const createQnASchema = z.object({
  body: z.object({
    question: z.string({ required_error: "Question is required" }).trim(),
    slug: z.string({ required_error: "Slug is required" }).trim().toLowerCase(),
    answer: z.string({ required_error: "Answer is required" }),
    category: z.string({ required_error: "Category is required" }),
    topic: z.string({ required_error: "Topic is required" }),
    tags: z.array(z.string()).optional(),
    relatedBlogs: z.array(z.string()).optional(),
    relatedQuestions: z.array(z.string()).optional(),
    relatedBooks: z.array(z.string()).optional(),
    seo: seoValidationSchema.optional(),
    status: z.enum(["draft", "published", "archived"]).default("draft"),
  }),
});

const updateQnASchema = z.object({
  body: z.object({
    question: z.string().trim().optional(),
    slug: z.string().trim().toLowerCase().optional(),
    answer: z.string().optional(),
    category: z.string().optional(),
    topic: z.string().optional(),
    tags: z.array(z.string()).optional(),
    relatedBlogs: z.array(z.string()).optional(),
    relatedQuestions: z.array(z.string()).optional(),
    relatedBooks: z.array(z.string()).optional(),
    seo: seoValidationSchema.optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
  }),
});

export const QnAValidation = {
  createQnASchema,
  updateQnASchema,
};
