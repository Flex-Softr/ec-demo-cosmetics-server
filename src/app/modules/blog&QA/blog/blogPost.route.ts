import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import { BlogPostController } from "./blogPost.controller";
import { BlogPostValidation } from "./blogPost.validation";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";

const router = Router();

// POST /api/blog-posts
router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(BlogPostValidation.createBlogPostSchema),
  BlogPostController.createBlogPost
);

// GET /api/blog-posts
router.get("/", BlogPostController.getAllBlogPosts);

// GET /api/blog-posts/slug/:slug
router.get("/slug/:slug", BlogPostController.getBlogPostBySlug);

// GET /api/blog-posts/:id
router.get("/:id", BlogPostController.getBlogPostById);

// PATCH /api/blog-posts/:id/views  — increment views (public, no auth needed)
router.patch("/:id/views", BlogPostController.incrementBlogPostViews);

// PATCH /api/blog-posts/:id
router.patch(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(BlogPostValidation.updateBlogPostSchema),
  BlogPostController.updateBlogPost
);

// DELETE /api/blog-posts/:id
router.delete(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  BlogPostController.deleteBlogPost
);

export const BlogPostRoutes = router;
