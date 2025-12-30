import express from "express";
import authGuard from "../../../middlewares/authGuard";
import limitRequest from "../../../middlewares/requestLimitHandler";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { AuthControllers } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const route = express.Router();

route.post(
  "/login",
  validateRequest(AuthValidation.login),
  limitRequest(1),
  AuthControllers.login
);
route.post(
  "/access-token",
  // validateRequest(refreshTokenZodSchema),
  AuthControllers.refreshToken
);
route.post(
  "/change-password",
  validateRequest(AuthValidation.changePassword),
  authGuard({
    requiredRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.CUSTOMER,
      ROLES.STAFF,
    ],
  }),
  AuthControllers.changePassword
);

route.post(
  "/logout",
  // validateRequest(refreshTokenZodSchema),
  // authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CUSTOMER, ROLES.STAFF ] }),
  AuthControllers.logoutUser
);

route.get(
  "/logged-in-devices",
  authGuard({
    requiredRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.CUSTOMER,
      ROLES.STAFF,
    ],
  }),
  AuthControllers.getLoggedInDevices
);

route.post(
  "/forget-password",
  validateRequest(AuthValidation.forgetPassword),
  AuthControllers.forgetPassword
);

route.post(
  "/reset-password",
  validateRequest(AuthValidation.resetPassword),
  AuthControllers.resetPassword
);

export const AuthRouters = route;
