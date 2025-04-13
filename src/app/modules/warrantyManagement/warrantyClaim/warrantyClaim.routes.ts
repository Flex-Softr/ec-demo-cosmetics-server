import { Router } from "express";
import { z } from "zod";
import config from "../../../config/config";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { imageAndVideoUploader } from "../../../utilities/imgUploader";
import { WarrantyClaimController } from "./warrantyClaim.controller";
import { WarrantyClaimMiddlewares } from "./warrantyClaim.middlewares";
import { WarrantyClaimValidation } from "./warrantyClaim.validate";

const router = Router();

router.get(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin", "staff"] }),
  WarrantyClaimController.getAllWarrantyClaimReq
);

router.post(
  "/check-warranty",
  validateRequest(WarrantyClaimValidation.checkWarranty),
  WarrantyClaimController.checkWarranty
);

router.post(
  "/",
  imageAndVideoUploader.array("files", Number(config.upload_image_maxCount)),
  WarrantyClaimMiddlewares.parseFormData,
  validateRequest(WarrantyClaimValidation.createWarrantyClaimReq),
  WarrantyClaimMiddlewares.validateWarrantyMiddleware,
  WarrantyClaimController.createWarrantyClaimReq
);

router.patch(
  "/update-request/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage warranty claim",
  }),
  validateRequest(WarrantyClaimValidation.updateWarrantyClaimReq),
  WarrantyClaimController.updateWarrantyClaimReq
);

router.post(
  "/create-order/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage warranty claim",
  }),
  validateRequest(WarrantyClaimValidation.approveAndCreateOrder),
  WarrantyClaimController.createNewWarrantyClaimOrder
);

router.patch(
  "/update-variation/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage warranty claim",
  }),
  validateRequest(
    z.object({
      body: z.object({
        itemId: z.string({ required_error: "Item id is required" }),
        newVariation: z.string({ required_error: "New Variation id required" }),
      }),
    })
  ),
  WarrantyClaimController.updateClaimProductVariation
);

export const WarrantyClaimRoutes = router;
