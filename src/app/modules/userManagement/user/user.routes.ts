import express from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { employPhotoUploader } from "../../../utilities/imgUploader";
import { ROLES } from "./user.const";
import { UserControllers } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

router.get(
  "/all-admin-staff",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ADMIN_OR_STAFF,
  }),
  UserControllers.getAllAdminAndStaff
);

router.post(
  "/create-customer",
  validateRequest(UserValidation.createCustomer),
  UserControllers.createCustomer
);

router.post(
  "/create-staff-or-admin",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ADMIN_OR_STAFF,
  }),
  employPhotoUploader.array("image", 1),
  validateRequest(UserValidation.createStaffOrAdmin),
  UserControllers.createAdminOrStaff
);

router.patch(
  "/update-admin-or-staff/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ADMIN_OR_STAFF,
  }),
  employPhotoUploader.array("image", 1),
  validateRequest(UserValidation.updateStaffOrAdmin),
  UserControllers.updateAdminOrStaff
);

router.get(
  "/profile",
  authGuard({
    requiredRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.CUSTOMER,
      ROLES.STAFF,
    ],
  }),
  UserControllers.getUserProfile
);

router.delete(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ADMIN_OR_STAFF,
  }),
  UserControllers.deleteUser
);

export const UserRoutes = router;
