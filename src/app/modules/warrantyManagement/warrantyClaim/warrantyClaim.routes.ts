import { Router } from "express";
import { z } from "zod";
import config from "../../../config/config";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { imageAndVideoUploader } from "../../../utilities/imgUploader";
import { ROLES } from "../../userManagement/user/user.const";
import { WarrantyClaimController } from "./warrantyClaim.controller";
import { WarrantyClaimMiddlewares } from "./warrantyClaim.middlewares";
import { WarrantyClaimValidation } from "./warrantyClaim.validate";

const router = Router();

router.get(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
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
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_WARRANTY_CLAIM,
  }),
  validateRequest(WarrantyClaimValidation.updateWarrantyClaimReq),
  WarrantyClaimController.updateWarrantyClaimReq
);

router.post(
  "/create-order/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_WARRANTY_CLAIM,
  }),
  validateRequest(WarrantyClaimValidation.approveAndCreateOrder),
  WarrantyClaimController.createNewWarrantyClaimOrder
);

router.patch(
  "/update-variation/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_WARRANTY_CLAIM,
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
