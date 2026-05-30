import { Router } from "express";
import { BlogQATopicController } from "./blogQATopic.controller";
import { BlogQATopicValidation } from "./blogQATopic.validation";
import validateRequest from "../../../middlewares/validateRequest";

const router = Router();

// POST /api/blog-qa-topics
router.post(
  "/",
  validateRequest(BlogQATopicValidation.createBlogQATopicSchema),
  BlogQATopicController.createBlogQATopic
);

// GET /api/blog-qa-topics
router.get("/", BlogQATopicController.getAllBlogQATopics);

// GET /api/blog-qa-topics/slug/:slug
router.get("/slug/:slug", BlogQATopicController.getBlogQATopicBySlug);

// GET /api/blog-qa-topics/:id
router.get("/:id", BlogQATopicController.getBlogQATopicById);

// PATCH /api/blog-qa-topics/:id
router.patch(
  "/:id",
  validateRequest(BlogQATopicValidation.updateBlogQATopicSchema),
  BlogQATopicController.updateBlogQATopic
);

// DELETE /api/blog-qa-topics/:id
router.delete("/:id", BlogQATopicController.deleteBlogQATopic);

export const BlogQATopicRoutes = router;
