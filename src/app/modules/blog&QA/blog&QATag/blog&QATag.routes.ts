import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { BlogQATagController } from "./blog&QATag.controller";
import { BlogQATagValidation } from "./blog&QATag.validation";
import { ROLES } from "../../userManagement/user/user.const";

const router = Router();

// POST /api/blog-qa-tags
router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
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
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(BlogQATagValidation.updateBlogQATagSchema),
  BlogQATagController.updateBlogQATag
);

// DELETE /api/blog-qa-tags/:id
router.delete(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  BlogQATagController.deleteBlogQATag
);

export const BlogQATagRoutes = router;
