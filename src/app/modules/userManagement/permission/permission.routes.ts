import { Router } from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { PermissionController } from "./permission.controller";
import { PermissionValidation } from "./permission.validate";
const router = Router();

router.get(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  }),
  PermissionController.getPermissions
);

router.post(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  }),
  validateRequest(PermissionValidation.createPermission),
  PermissionController.createPermission
);

router.post(
  "/add-permission-to-user/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PERMISSION,
  }),
  validateRequest(PermissionValidation.addPermissionToUser),
  PermissionController.addPermissionToUser
);

export const PermissionRoutes = router;
