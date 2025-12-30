import { Router } from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { OrderSMSNotificationController } from "./orderSMSNotification.controller";
import { OrderSMSNotificationValidation } from "./orderSMSNotification.validate";

const router = Router();

router.post(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SMS,
  }),
  validateRequest(OrderSMSNotificationValidation.createOrderSMSNotification),
  OrderSMSNotificationController.createOrderSMSNotification
);

router.get(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SMS,
  }),
  OrderSMSNotificationController.getOrderSMSNotification
);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SMS,
  }),
  OrderSMSNotificationController.updateOrderSMSNotification
);

export const OrderSMSNotificationRotes = router;
