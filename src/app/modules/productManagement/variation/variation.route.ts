import express from "express";
// import validateRequest from "../../../middlewares/validateRequest";
// import { variationdeleteVariationControllers } from "./variation.controller";
// import { TagValidation } from "./tag.validation";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import { ROLES } from "../../userManagement/user/user.const";
import { VariationControllers } from "./variation.controller";

const router = express.Router();

// router.post(
//   "/",
//   authGuard({
//     requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
//     requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
//   }),
//   validateRequest(TagValidation.tag),
//   TagControllers.createTag
// );

// router.get("/", TagControllers.getAllTags);

// router.patch(
//   "/:id",
//   authGuard({
//     requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
//     requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
//   }),
//   validateRequest(TagValidation.tag),
//   TagControllers.updateTag
// );

router.delete(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  VariationControllers.deleteVariation
);

export const VariationRoutes = router;
