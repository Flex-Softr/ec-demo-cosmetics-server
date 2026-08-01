import { Router } from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { SalesController } from "./sales.controller";
import { SalesValidation } from "./sales.validation";

const route = Router();

const auth = {
  requiredRoles: [ROLES.SUPER_ADMIN],
  requiredPermission: PERMISSIONS.SUPER_ADMIN,
};

route.get(
  "/summary",
  authGuard(auth),
  validateRequest(SalesValidation.summary),
  SalesController.getSalesSummary
);

route.get(
  "/orders",
  authGuard(auth),
  validateRequest(SalesValidation.orders),
  SalesController.getSalesOrders
);

route.get(
  "/by-product",
  authGuard(auth),
  validateRequest(SalesValidation.byProduct),
  SalesController.getSalesByProduct
);

route.get(
  "/by-category",
  authGuard(auth),
  validateRequest(SalesValidation.byCategory),
  SalesController.getSalesByCategory
);

route.get(
  "/payments",
  authGuard(auth),
  validateRequest(SalesValidation.payments),
  SalesController.getSalesByPayments
);

export const SalesRoutes = route;
