import express from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
import { ProductControllers } from "./product.controller";
import { ProductValidation } from "./product.validation";
// import imgUploader from "../../../utilities/imgUploader";
// import formDataParse from "../../../utilities/formDataParse";

const router = express.Router();

router.post(
  "/",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
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

router.get("/related-products/:slug", ProductControllers.getRelatedProducts);

router.get("/price-range", ProductControllers.getProductPriceRange);

router.get(
  "/admin",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    // requiredPermission: "manage product",
  }),
  ProductControllers.getAllProductsAdmin
);

router.get(
  "/:id/admin",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  ProductControllers.getAProductAdmin
);

router.get("/:slug", ProductControllers.getAProductCustomer);

router.get("/", ProductControllers.getAllProductsCustomer);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
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
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PRODUCT,
  }),
  ProductControllers.deleteProduct
);

export const ProductRoutes = router;
