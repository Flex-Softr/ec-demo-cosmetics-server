import express from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { TagControllers } from "./tag.controller";
import { TagValidation } from "./tag.validation";

const router = express.Router();

router.post(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  validateRequest(TagValidation.tag),
  TagControllers.createTag
);

router.get("/", TagControllers.getAllTags);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  validateRequest(TagValidation.tag),
  TagControllers.updateTag
);

router.delete(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  TagControllers.deleteTag
);

export const TagRoutes = router;
