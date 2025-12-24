import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { PaymentMethodController } from "./paymentMethod.controller";
import { PaymentMethodValidation } from "./paymentMethod.validation";
const route = Router();

route.get("/", PaymentMethodController.getPaymentMethods);

route.post(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage orders",
  }),
  validateRequest(PaymentMethodValidation.createPaymentMethodValidationSchema),
  PaymentMethodController.createPaymentMethod
);

route.patch(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage orders",
  }),
  validateRequest(PaymentMethodValidation.updatePaymentMethodValidationSchema),
  PaymentMethodController.updatePaymentMethod
);

route.delete(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage orders",
  }),
  PaymentMethodController.deletePaymentMethod
);

export const paymentMethodRoutes = route;
