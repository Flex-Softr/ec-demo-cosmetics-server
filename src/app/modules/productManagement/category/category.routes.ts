import express from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { CategoryControllers } from "./category.controller";
import { CategoryValidation } from "./category.validation";

const router = express.Router();

router.post(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  validateRequest(CategoryValidation.category),
  CategoryControllers.createCategory
);

router.get("/", CategoryControllers.getAllCategories);

router.get("/:id", CategoryControllers.getSingleCategory);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  validateRequest(CategoryValidation.updateCategory),
  CategoryControllers.updateCategory
);

router.delete(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  CategoryControllers.deleteCategory
);

export const CategoryRoutes = router;
