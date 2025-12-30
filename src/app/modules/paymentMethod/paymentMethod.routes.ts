import { Router } from "express";
import { PERMISSIONS } from "../../const/permission.const";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../userManagement/user/user.const";
import { PaymentMethodController } from "./paymentMethod.controller";
import { PaymentMethodValidation } from "./paymentMethod.validation";
const route = Router();

route.get("/", PaymentMethodController.getPaymentMethods);

route.post(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ORDER,
  }),
  validateRequest(PaymentMethodValidation.createPaymentMethodValidationSchema),
  PaymentMethodController.createPaymentMethod
);

route.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ORDER,
  }),
  validateRequest(PaymentMethodValidation.updatePaymentMethodValidationSchema),
  PaymentMethodController.updatePaymentMethod
);

route.delete(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ORDER,
  }),
  PaymentMethodController.deletePaymentMethod
);

export const paymentMethodRoutes = route;
