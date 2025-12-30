import { Router } from "express";
import config from "../../config/config";
import authGuard from "../../middlewares/authGuard";
import imgUploader from "../../utilities/imgUploader";
import { ROLES } from "../userManagement/user/user.const";
import { ImageControllers } from "./image.controller";

const router = Router();

router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  imgUploader.array("images", Number(config.upload_image_maxCount)),
  ImageControllers.createImage
);

router.get(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  ImageControllers.getAnImage
);

router.get(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  ImageControllers.getAllImages
);

router.delete(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }),
  ImageControllers.deleteImages
);

export const ImageRoutes = router;
