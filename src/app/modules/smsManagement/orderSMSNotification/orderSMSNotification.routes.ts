import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { OrderSMSNotificationController } from "./orderSMSNotification.controller";
import { OrderSMSNotificationValidation } from "./orderSMSNotification.validate";

const router = Router();

router.post(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage SMS",
  }),
  validateRequest(OrderSMSNotificationValidation.createOrderSMSNotification),
  OrderSMSNotificationController.createOrderSMSNotification
);

router.get(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage SMS",
  }),
  OrderSMSNotificationController.getOrderSMSNotification
);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage SMS",
  }),
  OrderSMSNotificationController.updateOrderSMSNotification
);

export const OrderSMSNotificationRotes = router;
