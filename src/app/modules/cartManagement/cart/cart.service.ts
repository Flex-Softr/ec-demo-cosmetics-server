import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import { TImage } from "../../image/image.interface";
import { TPrice } from "../../productManagement/price/price.interface";
import {
  TProduct,
  TVariation,
} from "../../productManagement/product/product.interface";
import ProductModel from "../../productManagement/product/product.model";
import { TCart, TCartData } from "./cart.interface";
import { CartHelper } from "./cart.helper";
import { Cart } from "./cart.model";

const getCartFromDB = async (user: TOptionalAuthGuardPayload) => {
  const query = optionalAuthUserQuery(user);
  if (query.userId) {
    query.userId = new Types.ObjectId(query.userId);
  }

  const result = await Cart.find(query, {}).populate([
    {
      path: "product",
      select: "_id title price image.thumbnail",
      populate: [
        {
          path: "price",
        },
        {
          path: "image.thumbnail",
          select: "src alt",
        },
      ],
    },
    {
      path: "variation",
      populate: {
        path: "price",
      },
    },
  ]);

  const response = result?.map((item) => {
    const product = item?.product as TProduct;
    const variation = item?.variation as TVariation;
    const price = product?.price as TPrice;
    const image = product?.image?.thumbnail as unknown as TImage;
    const data = {
      product: {
        _id: product?._id,
        title: product?.title,
        image: {
          src: `${config.image_base_url}/${image?.src}`,
          alt: image?.alt,
        },
      },
      price: {
        regularPrice: (variation?.price as TPrice)?.regularPrice
          ? (variation?.price as TPrice)?.regularPrice
          : price?.regularPrice,
        salePrice: (variation?.price as TPrice)?.salePrice
          ? (variation?.price as TPrice)?.salePrice
          : price?.salePrice,
      },
      variation: variation,
      quantity: item?.quantity,
      _id: item?._id,
    };
    return data;
  });

  return response;
};

const addToCartIntoDB = async (
  user: TOptionalAuthGuardPayload,
  payload: TCartData
): Promise<void> => {
  const product = await ProductModel.findOne(
    { _id: payload.product },
    { isDeleted: 1, variations: 1 }
  );

  if (!product || product.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No product found");
  }

  await CartHelper.checkInventory({
    quantity: Number(payload.quantity || 1),
    item: {
      product: product?._id as Types.ObjectId,
      variation: payload.variation as Types.ObjectId,
    },
  });

  if (product?.variations?.length) {
    if (!payload.variation)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No variation has been selected"
      );
  } else {
    payload.variation = undefined;
  }

  const cartData: TCartData = {
    userId: user.id,
    sessionId: user.sessionId,
    ...payload,
  };

  const query = optionalAuthUserQuery(user);
  const existingCart = await Cart.findOne({
    ...query,
    product: payload.product,
    variation: payload.variation,
  });

  if (existingCart) {
    const newQuantity = existingCart.quantity + Number(payload.quantity || 1);
    await CartHelper.checkInventory({
      quantity: newQuantity,
      item: {
        product: product?._id as Types.ObjectId,
        variation: payload.variation as Types.ObjectId,
      },
    });

    existingCart.quantity = newQuantity;
    await existingCart.save();
  } else {
    await Cart.create(cartData);
  }
};

const updateQuantityIntoDB = async (
  user: TOptionalAuthGuardPayload,
  payload: Partial<TCart>
) => {
  let query: Record<string, unknown> = optionalAuthUserQuery(user);

  query = { ...query, _id: payload._id };
  const cart = await Cart.findOne(query);

  if (!cart) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No cart item found");
  }

  await CartHelper.checkInventory({
    quantity: Number(payload.quantity || 1),
    item: {
      product: cart?.product as Types.ObjectId,
      variation: cart?.variation as Types.ObjectId,
    },
  });

  cart.quantity = Number(payload.quantity) || 1;
  await cart.save();
};

const deleteFromCartFromDB = async (
  user: TOptionalAuthGuardPayload,
  payload: { itemId: mongoose.Types.ObjectId }
) => {
  const query = optionalAuthUserQuery(user);
  await Cart.deleteOne({
    ...query,
    _id: payload.itemId,
  });
};

export const CartServices = {
  addToCartIntoDB,
  getCartFromDB,
  updateQuantityIntoDB,
  deleteFromCartFromDB,
};
