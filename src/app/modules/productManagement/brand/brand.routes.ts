import express from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { BrandControllers } from "./brand.controller";
import { BrandValidation } from "./brand.validation";

const router = express.Router();

router.post(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  validateRequest(BrandValidation.brand),
  BrandControllers.createBrand
);

router.get("/", BrandControllers.getAllBrands);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  validateRequest(BrandValidation.updateBrand),
  BrandControllers.updateBrand
);

router.delete(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  BrandControllers.deleteBrand
);

export const BrandRoutes = router;
