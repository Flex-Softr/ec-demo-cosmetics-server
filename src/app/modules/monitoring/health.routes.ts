import express from "express";
import { HealthControllers } from "./health.controller";
import authGuard from "../../middlewares/authGuard";
import { ROLES } from "../userManagement/user/user.const";

const router = express.Router();

router.get(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  }),
  HealthControllers.getHealth
);

export const MonitoringRoutes = router;
