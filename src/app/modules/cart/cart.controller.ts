import { Request, Response } from "express";
import httpStatus from "http-status";
import { TOptionalAuthGuardPayload } from "../../types/common";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { CartServices } from "./cart.service";

const getCartInfo = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as TOptionalAuthGuardPayload;
  const result = await CartServices.getCartFromDB(user);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Cart info retrieved successfully",
    data: result,
  });
});

const addToCart = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as TOptionalAuthGuardPayload;
  const data = req.body;

  const result = await CartServices.addToCartIntoDB(user, data);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Added to cart successfully",
    data: result,
  });
});

const updateQuantity = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as TOptionalAuthGuardPayload;
  const payload = { ...req.body, _id: req.body.cartItemId };
  const result = await CartServices.updateQuantityIntoDB(user, payload);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Quantity updated",
    data: result,
  });
});

const deleteFromCart = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as TOptionalAuthGuardPayload;
  const result = await CartServices.deleteFromCartFromDB(user, req.body);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Deleted successfully",
    data: result,
  });
});

export const CartController = {
  addToCart,
  getCartInfo,
  updateQuantity,
  deleteFromCart,
};
