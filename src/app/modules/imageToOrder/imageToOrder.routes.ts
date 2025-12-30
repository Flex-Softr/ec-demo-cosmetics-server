import { Router } from "express";
import { PERMISSIONS } from "../../const/permission.const";
import authGuard from "../../middlewares/authGuard";
import optionalAuthGuard from "../../middlewares/optionalAuthGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ImageToOrderImgUploader } from "../../utilities/imgUploader";
import { ROLES } from "../userManagement/user/user.const";
import { ImageToOrderController } from "./imageToOrder.controller";
import { ImageToOrderValidate } from "./imageToOrder.validate";

const router = Router();

router.post(
  "/",
  optionalAuthGuard,
  ImageToOrderImgUploader.array("images", 5),
  validateRequest(ImageToOrderValidate.createReq),
  ImageToOrderController.createReq
);

router.get(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_IMAGE_TO_ORDER,
  }),
  ImageToOrderController.getAllReqAdmin
);

router.get(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_IMAGE_TO_ORDER,
  }),
  ImageToOrderController.getReqByIdAdmin
);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_IMAGE_TO_ORDER,
  }),
  validateRequest(ImageToOrderValidate.updateRequest),
  ImageToOrderController.updateReqByAdmin
);

router.post(
  "/create-order/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_IMAGE_TO_ORDER,
  }),
  validateRequest(ImageToOrderValidate.createOrder),
  ImageToOrderController.createOrder
);

export const ImageToOrderRoutes = router;
