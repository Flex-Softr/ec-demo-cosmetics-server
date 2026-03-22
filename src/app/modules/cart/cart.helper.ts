import httpStatus from "http-status";
import moment from "moment";
import { ClientSession, Types } from "mongoose";
import config from "../../config/config";
import ApiError from "../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../types/common";
import { Cart } from "./cart.model";
import { STOCK_STATUS } from "../productManagement/inventory/inventory.const";
import {
  TInventory,
  TStockStatus,
} from "../productManagement/inventory/inventory.interface";
import { TProduct } from "../productManagement/product/product.interface";
import ProductModel from "../productManagement/product/product.model";
import { TVariation } from "../productManagement/variation/variation.interface";

const checkInventory = async (payload: {
  item: { product: Types.ObjectId | TProduct; variation?: Types.ObjectId };
  quantity: number;
  session?: ClientSession;
}) => {
  const { item, quantity, session } = payload;
  let productData: TProduct | null = null;

  if (typeof item.product === "object" && "_id" in item.product) {
    productData = item.product as TProduct;
  }
  const productId =
    typeof item.product === "object" && "_id" in item.product
      ? (item.product._id as Types.ObjectId)
      : new Types.ObjectId(item.product as unknown as string);

  let variation = undefined;
  if (item?.variation) {
    variation = new Types.ObjectId(item?.variation);
  }
  let availableStock = 0;
  let manageStock = false;
  let stockStatus: TStockStatus | undefined = undefined;
  if (item?.variation) {
    // If productData doesn't exist or variations are not populated/missing
    if (
      !productData ||
      !productData.variations ||
      productData.variations.length === 0 ||
      typeof productData.variations[0] !== "object" ||
      !("inventory" in (productData.variations[0] as TVariation))
    ) {
      productData = await ProductModel.findOne(
        { _id: productId },
        { variations: 1, price: 1 }
      )
        .populate([
          {
            path: "variations",
            populate: { path: "inventory" },
          },
        ])
        .session(session as ClientSession)
        .lean();
    }

    if (!productData) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No product found");
    }

    const specificVariation = productData?.variations?.find(
      (variation: unknown) =>
        (variation as TVariation)?._id?.toString() ===
        item?.variation?.toString()
    ) as unknown as TVariation;

    if (!specificVariation) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Specific variation not found"
      );
    }

    const inventory = specificVariation?.inventory as TInventory;
    availableStock = inventory?.stockAvailable || 0;
    manageStock = inventory?.manageStock;
    stockStatus = inventory?.stockStatus;
  } else {
    if (!productData || !productData.inventory) {
      productData = await ProductModel.findById(productId, {
        inventory: 1,
      })
        .populate("inventory")
        .session(session as ClientSession)
        .lean();
    }

    const inventory = productData?.inventory as TInventory;

    availableStock = inventory?.stockAvailable || 0;
    manageStock = inventory?.manageStock || false;
    stockStatus = inventory?.stockStatus;
  }

  if (stockStatus === STOCK_STATUS.OUT_OF_STOCK) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The product is currently out of stock."
    );
  }

  // If the stock management is on
  if (manageStock) {
    if (availableStock < quantity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Insufficient stock quantity. Available: ${availableStock}, Requested: ${quantity}`
      );
    }
  }

  return {
    availableStock,
    manageStock,
    product: productId,
    variation: variation,
  };
};

/** Returns the expiry date for a cart item — 30 days from now. */
const getCartExpireAt = (): Date => {
  const expiresIn = config.cart_item_expires || "30d";
  const days = parseInt(expiresIn) || 30;
  return moment().add(days, "days").toDate();
};

const mergeGuestCartIntoUser = async (user: TOptionalAuthGuardPayload) => {
  if (!user.id || !user.sessionId) return;

  const guestCartItems = await Cart.find({
    sessionId: user.sessionId,
    userId: { $exists: false },
  });

  if (guestCartItems.length === 0) return;

  for (const item of guestCartItems) {
    const existingUserItem = await Cart.findOne({
      userId: user.id,
      product: item.product,
      variation: item.variation,
    });

    if (existingUserItem) {
      // Merge: update quantity of existing user item, delete guest item, extend TTL
      existingUserItem.quantity += item.quantity;
      existingUserItem.expireAt = getCartExpireAt();
      await existingUserItem.save();
      await Cart.deleteOne({ _id: item._id });
    } else {
      // Transfer: promote guest cart to user cart, extend TTL
      item.userId = new Types.ObjectId(user.id);
      item.expireAt = getCartExpireAt();
      await item.save();
    }
  }
};

export const CartHelper = {
  checkInventory,
  getCartExpireAt,
  mergeGuestCartIntoUser,
};
