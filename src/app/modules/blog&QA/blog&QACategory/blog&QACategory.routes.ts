import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import { BlogQAcategoryController } from "./blog&QACategory.controller";
import { BlogQAcategoryValidation } from "./blog&QACategory.validation";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";

const router = Router();

// POST /api/blog-categories
router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(BlogQAcategoryValidation.createBlogQAcategorySchema),
  BlogQAcategoryController.createBlogQAcategory
);

// GET /api/blog-categories
router.get("/", BlogQAcategoryController.getAllBlogQAcategories);

// GET /api/blog-categories/slug/:slug
router.get("/slug/:slug", BlogQAcategoryController.getBlogQAcategoryBySlug);

// GET /api/blog-categories/:id
router.get("/:id", BlogQAcategoryController.getBlogQAcategoryById);

// PATCH /api/blog-categories/:id
router.patch(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(BlogQAcategoryValidation.updateBlogQAcategorySchema),
  BlogQAcategoryController.updateBlogQAcategory
);

// DELETE /api/blog-categories/:id
router.delete(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  BlogQAcategoryController.deleteBlogQAcategory
);

export const BlogQAcategoryRoutes = router;
