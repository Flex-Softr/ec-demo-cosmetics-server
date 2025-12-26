import httpStatus from "http-status";
import mongoose, { PipelineStage } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { warrantyDuration } from "../../../utilities/warrantyDuration";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { Order } from "../../orderManagement/order/order.model";
import { OrderStatusHistory } from "../../orderManagement/orderStatusHistory/orderStatusHistory.model";
import { TWarrantyData, TWarrantyInfoInput } from "./warranty.interface";
import { Warranty } from "./warranty.model";
import { findOrderWithWarrantyPipeline } from "./warranty.utils";

const createWarrantyIntoDB = async (
  order_id: mongoose.Types.ObjectId,
  warrantyInfo: TWarrantyInfoInput[],
  user: TJwtPayload
) => {
  const session = await mongoose.startSession();

  const postedWarrantyCodes = warrantyInfo.flatMap((item) =>
    item.codes.map((codeObj) => codeObj.code)
  );
  const previouslyAddedOrders =
    (await Warranty.aggregate([
      {
        $unwind: "$warrantyCodes",
      },
      {
        $match: {
          "warrantyCodes.code": { $in: postedWarrantyCodes },
        },
      },
      {
        $group: {
          _id: null,
          matchedCodes: { $addToSet: "$warrantyCodes.code" },
        },
      },
      {
        $project: {
          _id: 0,
          matchedCodes: 1,
        },
      },
    ]))![0]?.matchedCodes || [];
  if (previouslyAddedOrders.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `The warranty code${previouslyAddedOrders.length > 1 ? "s" : ""} ' ${previouslyAddedOrders} ' ${previouslyAddedOrders.length > 1 ? "are" : "is"} already in used`
    );
  }

  try {
    session.startTransaction();

    const pipeline: PipelineStage[] = findOrderWithWarrantyPipeline(order_id);

    const order = (await Order.aggregate(pipeline))[0];

    if (!order) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No order found.");
    }

    for (const item of order?.products || []) {
      if (item?.product?.warranty) {
        const findWarrantyInput = warrantyInfo.find(
          (itemInfo) => itemInfo.itemId === item._id.toString()
        );

        if (!findWarrantyInput) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Please add warranty for '${item?.product?.title}'`
          );
        }

        if (findWarrantyInput?.codes?.length !== item?.quantity) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Please add ${item.quantity} warranty codes for '${item.product.title}'`
          );
        }

        if (item?.warranty?.warrantyCodes?.length) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Warranty for product: '${item?.product?.title}' is already exist`
          );
        }

        let startDate, endDate;

        if (item?.isWarrantyClaim === true) {
          startDate = item?.prevWarrantyInformation?.startDate;
          endDate = item?.prevWarrantyInformation?.endsDate;
        } else {
          const { startDate: s, endDate: e } = warrantyDuration(
            item?.product?.warrantyInfo?.duration
          );
          startDate = s;
          endDate = e;
        }

        if (!startDate || !endDate) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Failed to calculate start and ends date"
          );
        }

        const warrantyData: TWarrantyData = {
          order_id,
          orderId: order?.orderId,
          productId: item?.product?._id,
          duration: item?.product?.warrantyInfo?.duration,
          startDate,
          endsDate: endDate as string,
          warrantyCodes: findWarrantyInput?.codes,
        };

        const warrantyRes = (
          await Warranty.create([warrantyData], { session })
        )[0];
        await Order.findOneAndUpdate(
          {
            _id: order_id,
            "orderedProducts._id": item._id,
          },
          {
            $set: {
              "orderedProducts.$.warranty": warrantyRes._id,
              status: "warranty added",
            },
            $unset: {
              "orderedProducts.$.prevWarrantyInformation": 1,
            },
          },
          { session }
        );
      }
    }

    await OrderStatusHistory.updateOne(
      { _id: order.statusHistory },
      {
        $push: {
          history: {
            status: "warranty added",
            updatedBy: user.id,
          },
        },
      },
      { session }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const updateWarrantyIntoDB = async (
  order_id: mongoose.Types.ObjectId,
  warrantyInfo: TWarrantyInfoInput[]
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const pipeline = findOrderWithWarrantyPipeline(order_id);

    const order = (await Order.aggregate(pipeline))[0];

    if (!order) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No order found");
    }

    for (const { itemId, codes } of warrantyInfo || []) {
      const findUpdatingItem = order?.products?.find(
        ({ _id }: { _id: mongoose.Types.ObjectId }) =>
          _id.toString() === itemId.toString()
      );
      if (findUpdatingItem) {
        if (findUpdatingItem.quantity !== codes.length) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Please add ${findUpdatingItem.quantity} warranty codes for '${findUpdatingItem?.product?.title}'`
          );
        }
      }

      await Warranty.updateOne(
        { _id: findUpdatingItem?.warranty?._id },
        { $set: { warrantyCodes: codes } },
        { session, upsert: true }
      );
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const WarrantyService = {
  createWarrantyIntoDB,
  updateWarrantyIntoDB,
};
