import express from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { SubCategoryControllers } from "./subCategory.controller";
import { SubCategoryValidation } from "./subCategory.validation";

const router = express.Router();

router.post(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  validateRequest(SubCategoryValidation.subCategory),
  SubCategoryControllers.createSubCategory
);

router.get("/", SubCategoryControllers.getAllSubCategories);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  validateRequest(SubCategoryValidation.updateSubCategory),
  SubCategoryControllers.updateSubCategory
);

router.delete(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  SubCategoryControllers.deleteSubCategory
);
router.get("/:id", SubCategoryControllers.getAllSubCategoriesCategory);

export const SubCategoryRoutes = router;
