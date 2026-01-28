import express from "express";
import { WebhookController } from "./webhook.controller";

const router = express.Router();

router.post("/:provider", WebhookController.parcelStatusHandler);

const WebhookRoutes = router;
export default WebhookRoutes;
