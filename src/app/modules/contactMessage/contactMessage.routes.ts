import express from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../userManagement/user/user.const";
import { ContactMessageController } from "./contactMessage.controller";
import { ContactMessageValidation } from "./contactMessage.validation";

const router = express.Router();

router.post(
  "/",
  validateRequest(ContactMessageValidation.createContactMessage),
  ContactMessageController.createContactMessage
);

router.get(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }),
  ContactMessageController.getAllContactMessages
);

router.get(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }),
  ContactMessageController.getSingleContactMessage
);

router.delete(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }),
  ContactMessageController.deleteContactMessage
);

export const ContactMessageRoutes = router;
