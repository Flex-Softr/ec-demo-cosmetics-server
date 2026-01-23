import express from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../userManagement/user/user.const";
import { HomepageSectionController } from "./homepageSection.controller";
import { HomepageSectionValidation } from "./homepageSection.validation";

const router = express.Router();

router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }),
  validateRequest(HomepageSectionValidation.createHomepageSection),
  HomepageSectionController.createHomepageSection
);

router.get("/", HomepageSectionController.getAllHomepageSections);

router.get("/:id", HomepageSectionController.getHomepageSectionById);

router.patch(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }),
  validateRequest(HomepageSectionValidation.updateHomepageSection),
  HomepageSectionController.updateHomepageSection
);

router.delete(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }),
  HomepageSectionController.deleteHomepageSection
);

router.get("/content/:id", HomepageSectionController.getHomepageSectionContent);

export const HomepageSectionRoutes = router;
