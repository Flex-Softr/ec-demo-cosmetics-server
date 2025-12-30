import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../userManagement/user/user.const";
import { UpazilaController } from "./upazila.controller";
import { UpzilaValidation } from "./upazila.validation";

const router = Router();

router.post(
  "/",
  authGuard({ requiredRoles: [ROLES.ADMIN] }),
  validateRequest(UpzilaValidation.create),
  UpazilaController.create
);

router.get("/", UpazilaController.getAllUpazilas);

export const UpazilaRoutes = router;
