import express from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { SliderSectionController } from "./sliderSection.controller";
import { SliderSectionValidation } from "./sliderSection.validation";

const router = express.Router();

router.post(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin", "staff"] }),
  validateRequest(SliderSectionValidation.sliderSection),
  SliderSectionController.createSliderSection
);

router.get("/", SliderSectionController.getSliderSections);

router.patch(
  "/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin", "staff"] }),
  validateRequest(SliderSectionValidation.updateSliderSection),
  SliderSectionController.updateSliderSection
);

router.delete(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin", "staff"] }),
  SliderSectionController.deleteSliderSection
);

export const SliderBannerRoutes = router;
