import express from "express";
import { ProductControllers } from "./product.controller";
import validateRequest from "../../../middlewares/validateRequest";
import { ProductValidation } from "./product.validation";
import authGuard from "../../../middlewares/authGuard";
// import imgUploader from "../../../utilities/imgUploader";
// import formDataParse from "../../../utilities/formDataParse";

const router = express.Router();

router.post(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  // imgUploader.fields([
  //   { name: "thumbnail", maxCount: 1 },
  //   { name: "gallery", maxCount: 5 },
  // ]),
  // formDataParse,
  validateRequest(ProductValidation.product),
  ProductControllers.createProduct
);

router.get("/best-selling", ProductControllers.getBestSellingProducts);

router.get("/featured", ProductControllers.getFeaturedProducts);

router.get(
  "/admin",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    // requiredPermission: "manage product",
  }),
  ProductControllers.getAllProductsAdmin
);

router.get(
  "/:id/admin",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  ProductControllers.getAProductAdmin
);

router.get("/:id", ProductControllers.getAProductCustomer);

router.get("/", ProductControllers.getAllProductsCustomer);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  // imgUploader.fields([
  //   { name: "thumbnail", maxCount: 1 },
  //   { name: "gallery", maxCount: 5 },
  // ]),
  // formDataParse,
  validateRequest(ProductValidation.updateProduct),
  ProductControllers.updateProduct
);

router.delete(
  "/delete",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  ProductControllers.deleteProduct
);

export const ProductRoutes = router;
