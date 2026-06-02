import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import { BlogQATopicController } from "./blogQATopic.controller";
import { BlogQATopicValidation } from "./blogQATopic.validation";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";

const router = Router();

// POST /api/blog-qa-topics
router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
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
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(BlogQATopicValidation.updateBlogQATopicSchema),
  BlogQATopicController.updateBlogQATopic
);

// DELETE /api/blog-qa-topics/:id
router.delete(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  BlogQATopicController.deleteBlogQATopic
);

export const BlogQATopicRoutes = router;
