import express from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../user/user.const";
import { CustomerControllers } from "./customer.controller";
import { CustomerValidation } from "./customer.validation";
const router = express.Router();

router.get(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  CustomerControllers.getAllCustomer
);

router.get(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  CustomerControllers.getSingleCustomerByAdmin
);

router.patch(
  "/",
  authGuard({ requiredRoles: [ROLES.CUSTOMER] }),
  validateRequest(CustomerValidation.updateUser),
  CustomerControllers.updateCustomer
);

router.patch(
  "/admin/:id",
  authGuard({ requiredRoles: [ROLES.ADMIN, ROLES.STAFF, ROLES.SUPER_ADMIN] }),
  CustomerControllers.updateCustomerByAdmin
);

export const CustomerRoutes = router;
