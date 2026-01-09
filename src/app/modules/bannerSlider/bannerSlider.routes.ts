import express from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../userManagement/user/user.const";
import { BannerSliderController } from "./bannerSlider.controller";
import { BannerSliderValidation } from "./bannerSlider.validation";

const router = express.Router();

router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(BannerSliderValidation.bannerSlider),
  BannerSliderController.createBannerSlider
);

router.get("/", BannerSliderController.getBannerSliders);

router.patch(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(BannerSliderValidation.updateBannerSlider),
  BannerSliderController.updateBannerSlider
);

router.delete(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  BannerSliderController.deleteBannerSlider
);

export const BannerSliderRoutes = router;
