import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { TInventory } from "../../productManagement/inventory/inventory.interface";
import ProductModel from "../../productManagement/product/product.model";
import { TVariation } from "../../productManagement/variation/variation.interface";

const checkInventory = async (payload: {
  item: { product: Types.ObjectId; variation?: Types.ObjectId };
  quantity: number;
}) => {
  const { item, quantity } = payload;
  const product = new Types.ObjectId(item?.product);

  let variation = undefined;
  if (item?.variation) {
    variation = new Types.ObjectId(item?.variation);
  }
  let availableStock = 0;
  let manageStock = false;
  if (item?.variation) {
    const productData = await ProductModel.findOne(
      {
        _id: product,
      },
      { variations: 1 }
    )
      .populate([{ path: "variations" }])
      .lean();

    const specificVariation = productData?.variations?.find(
      (variation) => variation?._id?.toString() === item?.variation?.toString()
    ) as unknown as TVariation;

    if (!productData) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No product found");
    }

    availableStock = specificVariation?.inventory?.stockAvailable || 0;
    manageStock = specificVariation?.inventory?.manageStock;
  } else {
    const productData = await ProductModel.findById(product, {
      inventory: 1,
    })
      .populate("inventory")
      .lean();

    const inventory = productData?.inventory as TInventory;

    availableStock = inventory?.stockAvailable || 0;
    manageStock = inventory?.manageStock || false;
  }

  // If the stock management is on
  if (manageStock) {
    if (availableStock < quantity) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Insufficient stock quantity");
    }
  }

  return {
    availableStock,
    manageStock,
    product: product,
    variation: variation,
  };
};

export const CartHelper = {
  checkInventory,
};
