import fsEx from "fs-extra";
import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import path from "path";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { Order } from "../../orderManagement/order/order.model";
import { createNewOrder } from "../../orderManagement/order/order.utils";
import { TShipping } from "../../orderManagement/shipping/shipping.interface";
import { TVariation } from "../../productManagement/product/product.interface";
import { Warranty } from "../warranty/warranty.model";
import { WarrantyClaimHistory } from "../warrantyClaimHistory/warrantyClaimHistory.model";
import {
  TWarrantyClaim,
  TWarrantyClaimedContactStatus,
  TWarrantyClaimedProductCondition,
  TWarrantyClaimedProductDetails,
  TWarrantyClaimReqData,
} from "./warrantyClaim.interface";
import { WarrantyClaim } from "./warrantyClaim.model";
import { WarrantyClaimUtils } from "./warrantyClaim.utils";

const getAllWarrantyClaimReqFromDB = async (query: Record<string, string>) => {
  if (!query.sort) {
    query.sort = "-createdAt";
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        approvalStatus: { $ne: "approved" },
        result: { $ne: "solved" },
      },
    },
    {
      $unwind: {
        path: "$warrantyClaimReqData", // Separate each warrantyClaimReqData entry
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "products", // Collection name for products
        localField: "warrantyClaimReqData.productId",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    {
      $lookup: {
        from: "warranty_claim_histories", // Collection name for warranty claim histories
        localField: "warrantyClaimReqData.warrantyClaimHistory",
        foreignField: "_id",
        as: "warrantyClaimHistory",
      },
    },
    {
      $unwind: {
        path: "$warrantyClaimHistory",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "variations",
        localField: "productInfo.variations",
        foreignField: "_id",
        as: "pVariations",
      },
    },
    {
      $project: {
        videosAndImages: 1,
        warrantyClaimReqData: {
          _id: "$warrantyClaimReqData._id",
          product: {
            _id: {
              $arrayElemAt: ["$productInfo._id", 0],
            },
            title: {
              $arrayElemAt: ["$productInfo.title", 0],
            },
            variations: "$pVariations",
          },
          warrantyClaimHistory: "$warrantyClaimHistory",
          claimedCodes: "$warrantyClaimReqData.claimedCodes",
          prevWarrantyInformation:
            "$warrantyClaimReqData.prevWarrantyInformation",
          variation: "$warrantyClaimReqData.variation",
          attributes: "$warrantyClaimReqData.attributes",
        },
        shipping: {
          fullName: "$shipping.fullName",
          phoneNumber: "$shipping.phoneNumber",
          fullAddress: "$shipping.fullAddress",
        },
        reqId: 1,
        problemInDetails: 1,
        contactStatus: 1,
        result: 1,
        approvalStatus: 1,
        officialNotes: 1,
        createdAt: 1,
      },
    },
    {
      $group: {
        _id: "$_id", // Group by warranty claim ID
        reqId: { $first: "$reqId" },
        videosAndImages: { $first: "$videosAndImages" },
        problemInDetails: { $first: "$problemInDetails" },
        contactStatus: { $first: "$contactStatus" },
        result: { $first: "$result" },
        approvalStatus: { $first: "$approvalStatus" },
        officialNotes: { $first: "$officialNotes" },
        shipping: { $first: "$shipping" },
        createdAt: { $first: "$createdAt" },
        warrantyClaimReqData: { $push: "$warrantyClaimReqData" },
      },
    },
  ];
  const resultQuery = new AggregateQueryHelper(
    WarrantyClaim.aggregate(pipeline),
    query
  )
    .sort()
    .paginate();

  const data = await resultQuery.model;
  const total = (await WarrantyClaim.aggregate(pipeline)).length;
  const meta = resultQuery.metaData(total);

  return { data, meta };
};

const checkWarrantyFromDB = async (
  phoneNumber: string,
  warrantyCodes: string[]
) => {
  await WarrantyClaimUtils.ifAlreadyClaimRequestPending(phoneNumber);
  const warranty = (
    await WarrantyClaimUtils.getWarrantyData(phoneNumber, warrantyCodes)
  ).map((item) => ({
    ...item,
  }));

  return warranty;
};

const createWarrantyClaimIntoDB = async (payload: TWarrantyClaim) => {
  const reqId = WarrantyClaimUtils.createReqID();
  const result = await WarrantyClaim.create({ ...payload, reqId });
  return result;
};

const updateWarrantyClaimReqIntoDB = async (
  id: Types.ObjectId,
  payload: Record<string, unknown>,
  user: TJwtPayload
) => {
  const warrantyClaimReq = await WarrantyClaim.findById(id);
  if (!warrantyClaimReq)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No warranty claim request found"
    );

  const { warrantyClaimReqData, shipping } = payload as {
    warrantyClaimReqData: string[];
    shipping: Partial<TShipping>;
  };

  if (payload.contactStatus) {
    warrantyClaimReq.contactStatus =
      payload.contactStatus as TWarrantyClaimedContactStatus;
  }

  if (payload.result) {
    if (!["confirmed"].includes(warrantyClaimReq.contactStatus)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Please contact the customer first."
      );
    }
    warrantyClaimReq.result =
      payload.result as TWarrantyClaimedProductCondition;
    warrantyClaimReq.identifiedBy = user.id;
    if (payload.result === "solved") {
      if (warrantyClaimReq?.videosAndImages?.length) {
        warrantyClaimReq?.videosAndImages?.forEach((item) => {
          try {
            const folderPath = path.parse(item.path).dir;
            fsEx.remove(folderPath);
            // eslint-disable-next-line no-empty
          } finally {
          }
        });
      }
      warrantyClaimReq.videosAndImages = [];
    }
  }

  if (payload.shipping) {
    const newShipping = {
      fullName: shipping.fullName ?? warrantyClaimReq.shipping.fullName,
      fullAddress:
        shipping.fullAddress ?? warrantyClaimReq.shipping.fullAddress,
      phoneNumber:
        shipping.phoneNumber ?? warrantyClaimReq.shipping.phoneNumber,
    };

    warrantyClaimReq.shipping = newShipping as unknown as TShipping;
  }

  if (payload.officialNotes || payload.officialNotes === "") {
    warrantyClaimReq.officialNotes = payload.officialNotes as string;
  }

  if ((warrantyClaimReqData || []).length) {
    const claimReqData = await WarrantyClaimUtils.validateWarranty({
      phoneNumber: warrantyClaimReq.phoneNumber,
      warrantyCodes: warrantyClaimReqData,
    });

    warrantyClaimReq.warrantyClaimReqData =
      claimReqData as TWarrantyClaimReqData[];
  }
  await warrantyClaimReq.save();
};

const createNewWarrantyClaimOrderIntoDB = async (
  id: Types.ObjectId,
  payload: Record<string, unknown>,
  user: TJwtPayload
) => {
  const claimReq = await WarrantyClaim.findById(id);
  if (claimReq?.orderId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This request is already approved and also created an order"
    );
  }

  if (!claimReq) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No warranty claim request found"
    );
  }

  if (claimReq?.contactStatus !== "confirmed") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Please contact the customer first"
    );
  }

  if (claimReq?.result !== "problem") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only problematic products will accept"
    );
  }

  if (claimReq?.videosAndImages?.length) {
    claimReq?.videosAndImages?.forEach((item) => {
      try {
        const folderPath = path.parse(item.path).dir;
        fsEx.remove(folderPath);
        // eslint-disable-next-line no-empty
      } finally {
      }
    });
  }

  const body = {
    ...payload,
    shipping: {
      fullName: claimReq?.shipping?.fullName,
      phoneNumber: claimReq?.shipping?.phoneNumber,
      fullAddress: claimReq?.shipping?.fullAddress,
    },
    orderSource: {
      name: "Warranty Claimed",
    },
  };

  const session = await mongoose.startSession();
  let order;
  try {
    session.startTransaction();

    const productsDetails: TWarrantyClaimedProductDetails[] = [];

    for (const item of claimReq?.warrantyClaimReqData || []) {
      const productDetails = (
        await Order.findOne(
          { _id: item.order_id },
          { "productDetails.warranty": 1, "productDetails._id": 1 }
        )
      )?.productDetails;

      const updatingWarrantyId = productDetails
        ?.find((pdt) => pdt?._id?.toString() === item.orderItemId.toString())
        ?.warranty?.toString();

      const currentClaim = {
        order_id: item.order_id,
        itemId: item.orderItemId as Types.ObjectId,
        claimedCodes: item.claimedCodes,
      };
      let history = undefined;
      if (item.warrantyClaimHistory) {
        await WarrantyClaimHistory.findByIdAndUpdate(
          item.warrantyClaimHistory,
          { $push: { claims: currentClaim } },
          { session }
        );

        history = item.warrantyClaimHistory;
      } else {
        const data = new WarrantyClaimHistory({
          parentOrder: item.order_id,
          parentItemId: item.orderItemId as Types.ObjectId,
          claims: [currentClaim],
        });

        history = (await data.save({ session }))._id;
      }

      await Warranty.updateOne(
        {
          _id: updatingWarrantyId,
        },
        { $pull: { warrantyCodes: { code: { $in: item.claimedCodes } } } },
        { session }
      );

      // Create product details for order data
      const newProductDetailsItem = {
        product: item.productId,
        quantity: item.claimedCodes?.length,
        variation: item.variation
          ? new Types.ObjectId(item.variation.toString())
          : undefined,
        claimedCodes: item.claimedCodes.map((item) => ({ code: item })),
        prevWarrantyInformation: item.prevWarrantyInformation,
        attributes: item.attributes,
        warrantyClaimHistory: history,
      };

      productsDetails.push(
        newProductDetailsItem as unknown as TWarrantyClaimedProductDetails
      );
    }

    order = await createNewOrder({ body, user }, session, {
      warrantyClaim: true,
      productsDetails,
    });

    // Update the warranty claim request
    await WarrantyClaim.findOneAndUpdate(
      { _id: id },
      {
        orderId: order._id,
        approvalStatus: "approved",
        finalCheckedBy: user.id,
        videosAndImages: undefined,
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

  return order;
};

const updateClaimProductVariationIntoDB = async (
  claimId: string,
  payload: { itemId: string; newVariation: string }
) => {
  const productDetails = (
    await WarrantyClaim.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(claimId),
          approvalStatus: { $ne: "approved" },
          result: { $ne: "solved" },
        },
      },
      {
        $unwind: {
          path: "$warrantyClaimReqData", // Separate each warrantyClaimReqData entry
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "products", // Collection name for products
          localField: "warrantyClaimReqData.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $project: {
          warrantyClaimReqData: {
            _id: "$warrantyClaimReqData._id",
            product: {
              _id: {
                $arrayElemAt: ["$productInfo._id", 0],
              },
              title: {
                $arrayElemAt: ["$productInfo.title", 0],
              },
              variations: {
                $arrayElemAt: ["$productInfo.variations", 0],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          warrantyClaimReqData: { $push: "$warrantyClaimReqData" },
        },
      },
    ])
  )[0];

  const attribute = (productDetails?.warrantyClaimReqData || [])
    ?.find((item: { _id: string }) => item?._id.toString() === payload.itemId)
    ?.product?.variations?.find(
      (item: { _id: Types.ObjectId } & TVariation) => {
        return item?._id?.toString() === payload.newVariation;
      }
    )?.attributes;

  await WarrantyClaim.updateOne(
    {
      _id: new Types.ObjectId(claimId),
      "warrantyClaimReqData._id": new Types.ObjectId(payload.itemId),
    },
    {
      $set: {
        "warrantyClaimReqData.$.variation": new mongoose.Types.ObjectId(
          payload.newVariation
        ),
        "warrantyClaimReqData.$.attributes": attribute,
      },
    }
  );
};

export const WarrantyClaimServices = {
  getAllWarrantyClaimReqFromDB,
  checkWarrantyFromDB,
  createWarrantyClaimIntoDB,
  updateWarrantyClaimReqIntoDB,
  createNewWarrantyClaimOrderIntoDB,
  updateClaimProductVariationIntoDB,
};
