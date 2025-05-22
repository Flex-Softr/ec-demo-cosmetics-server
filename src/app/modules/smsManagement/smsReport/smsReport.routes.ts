import { Router } from "express";
import { SMSReportController } from "./smsReport.controller";

const router = Router();

router.get("/total-sms-send", SMSReportController.getOrderSMSNotification);

export const SMSReportRoutes = router;
