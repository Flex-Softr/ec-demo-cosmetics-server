import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../userManagement/user/user.const";
import { DivisionController } from "./division.controller";
import { DivisionValidation } from "./division.validation";

const router = Router();

router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.ADMIN] }),
  validateRequest(DivisionValidation.create),
  DivisionController.create
);
router.get("/", DivisionController.getAllDivisions);

export const DivisionRoutes = router;
