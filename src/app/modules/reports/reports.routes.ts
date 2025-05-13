import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import { ReportsController } from "./reports.controller";

const route = Router();

const requiredPermission = "super admin";

route.get(
  "/orders-count",
  authGuard({ requiredRoles: ["superAdmin", "admin"], requiredPermission }),
  ReportsController.getOrdersCounts
);

route.get(
  "/orders-count-status",
  authGuard({ requiredRoles: ["superAdmin", "admin"], requiredPermission }),
  ReportsController.getOrderCountsByStatus
);

route.get(
  "/orders-source-count",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    // requiredPermission,
  }),
  ReportsController.getSourceCounts
);

route.get(
  "/orders-status-change-count",
  authGuard({ requiredRoles: ["superAdmin", "admin"], requiredPermission }),
  ReportsController.getOrderStatusChangeCounts
);

// This will return best selling products, it will skip warranty claim products
route.get(
  "/best-selling-product",
  authGuard({ requiredRoles: ["superAdmin", "admin"], requiredPermission }),
  ReportsController.getBestSellingProducts
);

route.get(
  "/stats",
  authGuard({ requiredRoles: ["superAdmin", "admin"], requiredPermission }),
  ReportsController.getStats
);

export const ReportsRoutes = route;
