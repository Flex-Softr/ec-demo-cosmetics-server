import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import ApiError from "../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../types/common";
import optionalAuthUserQuery from "../../types/optionalAuthUserQuery";
import { TImage } from "../image/image.interface";
import { TPrice } from "../productManagement/price/price.interface";
import { TProduct } from "../productManagement/product/product.interface";
import ProductModel from "../productManagement/product/product.model";
import { TVariation } from "../productManagement/variation/variation.interface";
import { CartHelper } from "./cart.helper";
import { TCart, TCartData } from "./cart.interface";
import { Cart } from "./cart.model";

const getCartFromDB = async (user: TOptionalAuthGuardPayload) => {
  // Merge guest cart if user is logged in
  if (user.id) {
    await CartHelper.mergeGuestCartIntoUser(user);
  }

  const userQuery = optionalAuthUserQuery(user);
  const query = {
    ...(userQuery.userId && {
      userId: new Types.ObjectId(userQuery.userId),
    }),
    ...(userQuery.sessionId && { sessionId: userQuery.sessionId }),
  };

  // Security safety check: If both userId and sessionId are somehow missing,
  // return empty result instead of matching everything.
  if (!query.userId && !query.sessionId) {
    return [];
  }

  const result = await Cart.find(query, {}).populate([
    {
      path: "product",
      select: "_id title slug price image.thumbnail inventory",
      populate: [
        {
          path: "price",
        },
        {
          path: "image.thumbnail",
          select: "src alt",
        },
        {
          path: "inventory",
        },
      ],
    },
    {
      path: "variation",
      populate: [
        {
          path: "price",
        },
        {
          path: "inventory",
        },
      ],
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
        id: product?.id,
        title: product?.title,
        image: {
          src: image?.src,
          alt: image?.alt,
        },
        slug: product?.slug,
      },
      price: {
        regularPrice: (variation?.price as TPrice)?.regularPrice
          ? (variation?.price as TPrice)?.regularPrice
          : price?.regularPrice,
        salePrice: (variation?.price as TPrice)?.salePrice
          ? (variation?.price as TPrice)?.salePrice
          : price?.salePrice,
      },
      variation: variation
        ? {
            _id: variation._id,
            attributes: variation.attributes as unknown as Record<
              string,
              string
            >,
          }
        : undefined,
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
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const product = await ProductModel.findOne(
      { _id: payload.product },
      { isDeleted: 1, variations: 1 }
    ).session(session);

    if (!product || product.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No product found");
    }

    await CartHelper.checkInventory({
      quantity: Number(payload.quantity || 1),
      item: {
        product: product?._id as Types.ObjectId,
        variation: payload.variation as Types.ObjectId,
      },
      session,
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
      expireAt: CartHelper.getCartExpireAt(), // 30 days for all carts
      ...payload,
    };

    const userQuery = optionalAuthUserQuery(user);
    const existingCart = await Cart.findOne({
      ...(userQuery.userId && { userId: userQuery.userId }),
      ...(userQuery.sessionId && { sessionId: userQuery.sessionId }),
      product: payload.product,
      variation: payload.variation,
    }).session(session);

    if (existingCart) {
      const newQuantity = existingCart.quantity + Number(payload.quantity || 1);
      await CartHelper.checkInventory({
        quantity: newQuantity,
        item: {
          product: product as unknown as TProduct,
          variation: payload.variation as Types.ObjectId,
        },
        session,
      });

      await Cart.updateOne(
        { _id: existingCart._id },
        {
          $set: {
            quantity: newQuantity,
            expireAt: CartHelper.getCartExpireAt(),
          },
        },
        { session }
      );
    } else {
      await Cart.create([cartData], { session });
    }

    await session.commitTransaction();
    session.endSession();
    return await getCartFromDB(user);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const updateQuantityIntoDB = async (
  user: TOptionalAuthGuardPayload,
  payload: Partial<TCart>
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userQuery = optionalAuthUserQuery(user);
    const query = {
      ...(userQuery.userId && { userId: userQuery.userId }),
      ...(userQuery.sessionId && { sessionId: userQuery.sessionId }),
      _id: payload._id,
    };
    const cart = await Cart.findOne(query).populate("product").session(session);

    if (!cart) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No cart item found");
    }

    await CartHelper.checkInventory({
      quantity: Number(payload.quantity || 1),
      item: {
        product: cart.product as unknown as TProduct,
        variation: cart?.variation as Types.ObjectId,
      },
      session,
    });

    await Cart.updateOne(
      { _id: cart._id },
      {
        $set: {
          quantity: Number(payload.quantity) || 1,
          expireAt: CartHelper.getCartExpireAt(),
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return await getCartFromDB(user);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const deleteFromCartFromDB = async (
  user: TOptionalAuthGuardPayload,
  payload: { itemId: string }
) => {
  const userQuery = optionalAuthUserQuery(user);
  await Cart.deleteOne({
    _id: payload.itemId,
    ...(userQuery.userId && { userId: userQuery.userId }),
    ...(userQuery.sessionId && { sessionId: userQuery.sessionId }),
  });
  return await getCartFromDB(user);
};

export const CartServices = {
  addToCartIntoDB,
  getCartFromDB,
  updateQuantityIntoDB,
  deleteFromCartFromDB,
};
