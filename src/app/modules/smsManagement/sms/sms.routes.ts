import { Router } from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { smsController } from "./sms.controller";
import { SmsValidation } from "./sms.validation";

const router = Router();

router.post(
  "/bulk-sms",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SMS,
  }),
  validateRequest(SmsValidation.bulkSms),
  smsController.sendBulkSms
);

export const SmsRoutes = router;
