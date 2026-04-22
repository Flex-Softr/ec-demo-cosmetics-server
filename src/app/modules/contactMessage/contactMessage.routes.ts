import express from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { PERMISSIONS } from "../../const/permission.const";
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
  "/unread-count",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    requiredPermission: PERMISSIONS.MANAGE_CONTACT_MESSAGE,
  }),
  ContactMessageController.getUnreadContactMessagesCount
);

router.get(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    requiredPermission: PERMISSIONS.MANAGE_CONTACT_MESSAGE,
  }),
  ContactMessageController.getAllContactMessages
);

router.get(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    requiredPermission: PERMISSIONS.MANAGE_CONTACT_MESSAGE,
  }),
  ContactMessageController.getSingleContactMessage
);

router.delete(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    requiredPermission: PERMISSIONS.MANAGE_CONTACT_MESSAGE,
  }),
  ContactMessageController.deleteContactMessage
);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    requiredPermission: PERMISSIONS.MANAGE_CONTACT_MESSAGE,
  }),
  ContactMessageController.updateContactMessageStatus
);

export const ContactMessageRoutes = router;
