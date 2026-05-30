import { Router } from "express";
import { BlogQAcategoryController } from "./blog&QACategory.controller";
import { BlogQAcategoryValidation } from "./blog&QACategory.validation";
import validateRequest from "../../../middlewares/validateRequest";

const router = Router();

// POST /api/blog-categories
router.post(
  "/",
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
  validateRequest(BlogQAcategoryValidation.updateBlogQAcategorySchema),
  BlogQAcategoryController.updateBlogQAcategory
);

// DELETE /api/blog-categories/:id
router.delete("/:id", BlogQAcategoryController.deleteBlogQAcategory);

export const BlogQAcategoryRoutes = router;
