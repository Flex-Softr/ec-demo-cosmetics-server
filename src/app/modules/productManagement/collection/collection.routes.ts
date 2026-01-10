import express from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { CollectionControllers } from "./collection.controller";
import { CollectionValidation } from "./collection.validation";

const router = express.Router();

router.post(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  }),
  validateRequest(CollectionValidation.createCollection),
  CollectionControllers.createCollection
);

router.get("/", CollectionControllers.getAllCollections);

router.get("/:slug", CollectionControllers.getSingleCollection);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  }),
  validateRequest(CollectionValidation.updateCollection),
  CollectionControllers.updateCollection
);

router.delete(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  }),
  CollectionControllers.deleteCollection
);

export const CollectionRoutes = router;
