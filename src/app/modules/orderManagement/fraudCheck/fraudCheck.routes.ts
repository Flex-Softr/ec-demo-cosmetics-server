import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import { ROLES } from "../../userManagement/user/user.const";
import { FraudCheckController } from "./fraudCheck.controller";

const router = Router();

router.get(
  "/fraud-customers/:mobile",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  }),
  FraudCheckController.fraudCheck
);

export const FraudCheckRoutes = router;
