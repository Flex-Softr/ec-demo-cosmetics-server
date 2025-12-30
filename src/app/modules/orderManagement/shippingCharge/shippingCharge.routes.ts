import { Router } from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { ShippingChargeController } from "./shippingCharge.controller";
import { ShippingChargeValidation } from "./shippingCharge.validate";

const router = Router();

router.get("/", ShippingChargeController.getShippingCharges);

router.get(
  "/admin",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPPING_CHARGE,
  }),
  ShippingChargeController.getShippingChargesAdmin
);

router.post(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPPING_CHARGE,
  }),
  validateRequest(ShippingChargeValidation.createShippingCharge),
  ShippingChargeController.createShippingCharge
);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPPING_CHARGE,
  }),
  validateRequest(ShippingChargeValidation.updateShippingCharge),
  ShippingChargeController.updateShippingCharge
);

export const ShippingChargeRoutes = router;
