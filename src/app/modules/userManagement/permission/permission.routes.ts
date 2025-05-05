import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { PermissionController } from "./permission.controller";
import { PermissionValidation } from "./permission.validate";

const router = Router();

router.get(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
  }),
  PermissionController.getPermissions
);

router.post(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin"],
  }),
  validateRequest(PermissionValidation.createPermission),
  PermissionController.createPermission
);

router.post(
  "/add-permission-to-user/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage permission",
  }),
  validateRequest(PermissionValidation.addPermissionToUser),
  PermissionController.addPermissionToUser
);

export const PermissionRoutes = router;
