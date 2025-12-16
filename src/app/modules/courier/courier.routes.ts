import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { CourierController } from "./courier.controller";
import { CourierValidation } from "./courier.validation";

const router = Router();

// Create new courier
router.post(
  "/",
  validateRequest(CourierValidation.createCourier),
  CourierController.createCourier
);

// Get all couriers
router.get("/", CourierController.getAllCouriers);

// Get single courier
router.get("/:id", CourierController.getSingleCourier);

// Update courier
router.patch(
  "/:id",
  validateRequest(CourierValidation.updateCourier),
  CourierController.updateCourier
);

// Delete courier
router.delete("/:id", CourierController.deleteCourier);

export const CourierRoutes = router;
