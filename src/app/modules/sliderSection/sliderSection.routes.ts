import express from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../userManagement/user/user.const";
import { SliderSectionController } from "./sliderSection.controller";
import { SliderSectionValidation } from "./sliderSection.validation";

const router = express.Router();

router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(SliderSectionValidation.sliderSection),
  SliderSectionController.createSliderSection
);

router.get("/", SliderSectionController.getSliderSections);

router.patch(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(SliderSectionValidation.updateSliderSection),
  SliderSectionController.updateSliderSection
);

router.delete(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  SliderSectionController.deleteSliderSection
);

export const SliderBannerRoutes = router;
