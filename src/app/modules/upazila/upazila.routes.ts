import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { UpazilaController } from "./upazila.controller";
import { UpzilaValidation } from "./upazila.validation";

const router = Router();

router.post(
  "/",
  authGuard({ requiredRoles: ["admin"] }),
  validateRequest(UpzilaValidation.create),
  UpazilaController.create
);

router.get("/", UpazilaController.getAllUpazilas);

export const UpazilaRoutes = router;
