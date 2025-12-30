import { Router } from "express";
import { PERMISSIONS } from "../../const/permission.const";
import authGuard from "../../middlewares/authGuard";
import { ROLES } from "../userManagement/user/user.const";
import { ReportsController } from "./reports.controller";

const route = Router();

const requiredPermission = PERMISSIONS.SUPER_ADMIN;

route.get(
  "/orders-count",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    requiredPermission,
  }),
  ReportsController.getOrdersCounts
);

route.get(
  "/orders-count-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    requiredPermission,
  }),
  ReportsController.getOrderCountsByStatus
);

route.get(
  "/orders-source-count",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    // requiredPermission,
  }),
  ReportsController.getSourceCounts
);

route.get(
  "/orders-status-change-count",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    requiredPermission,
  }),
  ReportsController.getOrderStatusChangeCounts
);

// This will return best selling products, it will skip warranty claim products
route.get(
  "/best-selling-product",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    requiredPermission,
  }),
  ReportsController.getBestSellingProducts
);

route.get(
  "/stats",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    requiredPermission,
  }),
  ReportsController.getStats
);

export const ReportsRoutes = route;
