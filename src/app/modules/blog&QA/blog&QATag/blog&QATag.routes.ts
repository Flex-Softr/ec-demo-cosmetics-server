import { Router } from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { BlogQATagController } from "./blog&QATag.controller";
import { BlogQATagValidation } from "./blog&QATag.validation";

const router = Router();

// POST /api/blog-qa-tags
router.post(
  "/",
  validateRequest(BlogQATagValidation.createBlogQATagSchema),
  BlogQATagController.createBlogQATag
);

// GET /api/blog-qa-tags
router.get("/", BlogQATagController.getAllBlogQATags);

// GET /api/blog-qa-tags/slug/:slug
router.get("/slug/:slug", BlogQATagController.getBlogQATagBySlug);

// GET /api/blog-qa-tags/:id
router.get("/:id", BlogQATagController.getBlogQATagById);

// PATCH /api/blog-qa-tags/:id
router.patch(
  "/:id",
  validateRequest(BlogQATagValidation.updateBlogQATagSchema),
  BlogQATagController.updateBlogQATag
);

// DELETE /api/blog-qa-tags/:id
router.delete("/:id", BlogQATagController.deleteBlogQATag);

export const BlogQATagRoutes = router;
