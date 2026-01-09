import { Router } from "express";
import optionalAuthGuard from "../../../middlewares/optionalAuthGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { CartController } from "./cart.controller";
import { CartValidation } from "./cart.validation";
const router = Router();

router.get("/", optionalAuthGuard, CartController.getCartInfo);

router.post(
  "/add-to-cart",
  validateRequest(CartValidation.Cart),
  optionalAuthGuard,
  CartController.addToCart
);

router.patch(
  "/update-quantity",
  validateRequest(CartValidation.updateQuantity),
  optionalAuthGuard,
  CartController.updateQuantity
);

router.delete(
  "/delete-from-cart",
  validateRequest(CartValidation.deleteCart),
  optionalAuthGuard,
  CartController.deleteFromCart
);

export const CartRoutes = router;
