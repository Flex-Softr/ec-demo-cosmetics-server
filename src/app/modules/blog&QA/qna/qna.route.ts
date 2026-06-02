import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { QnAController } from "./qna.controller";
import { QnAValidation } from "./qna.validation";
import { ROLES } from "../../userManagement/user/user.const";

const router = Router();

// POST /api/qna
router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(QnAValidation.createQnASchema),
  QnAController.createQnA
);

// GET /api/qna
router.get("/", QnAController.getAllQnAs);

// GET /api/qna/slug/:slug
router.get("/slug/:slug", QnAController.getQnABySlug);

// GET /api/qna/:id
router.get("/:id", QnAController.getQnAById);

// PATCH /api/qna/:id/views  — increment views (public, no auth needed)
router.patch("/:id/views", QnAController.incrementQnAViews);

// PATCH /api/qna/:id
router.patch(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(QnAValidation.updateQnASchema),
  QnAController.updateQnA
);

// DELETE /api/qna/:id
router.delete(
  "/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  QnAController.deleteQnA
);

export const QnARoutes = router;
