import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { smsController } from "./sms.controller";
import { SmsValidation } from "./sms.validation";

const router = Router();

router.post(
  "/bulk-sms",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage sms",
  }),
  validateRequest(SmsValidation.bulkSms),
  smsController.sendBulkSms
);

export const SmsRoutes = router;
