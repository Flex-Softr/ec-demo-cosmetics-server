import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import config from "../../config/config";
import pdfUploader from "../../utilities/pdfUploader";
import { ROLES } from "../userManagement/user/user.const";
import { BookPreviewControllers } from "./bookPreview.controller";

const router = Router();

router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  pdfUploader.array("previews", Number(config.upload_pdf_maxCount) || 5),
  BookPreviewControllers.createBookPreview
);

router.get(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  BookPreviewControllers.getABookPreview
);

router.get(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  BookPreviewControllers.getAllBookPreviews
);

router.delete(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }),
  BookPreviewControllers.deleteBookPreviews
);

export const BookPreviewRoutes = router;
