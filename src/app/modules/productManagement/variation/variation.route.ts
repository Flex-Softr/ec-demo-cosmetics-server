import express from "express";
// import validateRequest from "../../../middlewares/validateRequest";
// import { variationdeleteVariationControllers } from "./variation.controller";
// import { TagValidation } from "./tag.validation";
import authGuard from "../../../middlewares/authGuard";
import { VariationControllers } from "./variation.controller";

const router = express.Router();

// router.post(
//   "/",
//   authGuard({
//     requiredRoles: ["superAdmin", "admin", "staff"],
//     requiredPermission: "manage product",
//   }),
//   validateRequest(TagValidation.tag),
//   TagControllers.createTag
// );

// router.get("/", TagControllers.getAllTags);

// router.patch(
//   "/:id",
//   authGuard({
//     requiredRoles: ["superAdmin", "admin", "staff"],
//     requiredPermission: "manage product",
//   }),
//   validateRequest(TagValidation.tag),
//   TagControllers.updateTag
// );

router.delete(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  VariationControllers.deleteVariation
);

export const VariationRoutes = router;
