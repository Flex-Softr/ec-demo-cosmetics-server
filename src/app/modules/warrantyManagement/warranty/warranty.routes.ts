import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { WarrantyController } from "./warranty.controller";
import { ValidateWarranty } from "./warranty.validation";

const router = Router();

router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(ValidateWarranty.createWarranty),
  WarrantyController.createWarranty
);

router.patch(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(ValidateWarranty.createWarranty),
  WarrantyController.updateWarranty
);

export const WarrantyRoutes = router;
