import { Router } from "express";
import { PERMISSIONS } from "../../const/permission.const";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../userManagement/user/user.const";
import { CourierController } from "./courier.controller";
import { CourierValidation } from "./courier.validation";

const router = Router();

// Get all couriers
router.get(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_COURIER,
  }),
  CourierController.getAllCouriers
);

// Get redx delivery area
router.get(
  "/area/redx",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_COURIER,
  }),
  CourierController.getRedxDeliveryArea
);

// Get single courier
router.get(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_COURIER,
  }),
  CourierController.getSingleCourier
);

// Update courier
router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_COURIER,
  }),
  validateRequest(CourierValidation.updateCourier),
  CourierController.updateCourier
);

export const CourierRoutes = router;
