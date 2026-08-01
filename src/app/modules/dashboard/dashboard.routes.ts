import { Router } from "express";
import { PERMISSIONS } from "../../const/permission.const";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../userManagement/user/user.const";
import { DashboardController } from "./dashboard.controller";
import { DashboardValidation } from "./dashboard.validation";

const route = Router();

const auth = {
  requiredRoles: [ROLES.SUPER_ADMIN],
  requiredPermission: PERMISSIONS.SUPER_ADMIN,
};

route.get("/stats", authGuard(auth), DashboardController.getStats);

route.get("/order-status", authGuard(auth), DashboardController.getOrderStatus);

route.get(
  "/shipping-status",
  authGuard(auth),
  DashboardController.getShippingStatus
);

route.get(
  "/orders-summary",
  authGuard(auth),
  DashboardController.getOrdersSummary
);

route.get(
  "/order-report",
  authGuard(auth),
  validateRequest(DashboardValidation.orderReport),
  DashboardController.getOrderReport
);

route.get(
  "/top-customers",
  authGuard(auth),
  DashboardController.getTopCustomers
);

route.get(
  "/recent-orders",
  authGuard(auth),
  DashboardController.getRecentOrders
);

export const DashboardRoutes = route;
