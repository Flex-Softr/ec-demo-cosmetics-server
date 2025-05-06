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
    requiredPermission: "manage sms",
  }),
  validateRequest(OrderSMSNotificationValidation.createOrderSMSNotification),
  OrderSMSNotificationController.createOrderSMSNotification
);

router.get(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage sms",
  }),
  OrderSMSNotificationController.getOrderSMSNotification
);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage sms",
  }),
  OrderSMSNotificationController.updateOrderSMSNotification
);

export const OrderSMSNotificationRotes = router;
