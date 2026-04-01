import httpStatus from "http-status";
import { PipelineStage, Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { Order } from "../../orderManagement/order/order.model";
import { createOrderId } from "../../orderManagement/order/order.utils";
import { WarrantyClaim } from "./warrantyClaim.model";

const getWarrantyData = async (
  phoneNumber: string,
  warrantyCodes: string[]
) => {
  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "shippings",
        localField: "shipping",
        foreignField: "_id",
        as: "shippingData",
      },
    },
    {
      $unwind: "$shippingData",
    },
    {
      $match: {
        "shippingData.phoneNumber": phoneNumber,
      },
    },
    {
      $project: {
        _id: 1,
        orderId: 1,
        shipping: {
          fullName: "$shippingData.fullName",
          phoneNumber: "$shippingData.phoneNumber",
          fullAddress: "$shippingData.fullAddress",
        },
        shippingCharge: {
          name: "$shippingCharge.name",
          amount: "$shippingCharge.amount",
        },
        orderedProducts: 1,
        createdAt: 1,
      },
    },
    {
      $unwind: "$orderedProducts",
    },
    {
      $lookup: {
        from: "products",
        localField: "orderedProducts.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    {
      $unwind: "$productInfo",
    },
    {
      $lookup: {
        from: "images",
        localField: "productInfo.image.thumbnail",
        foreignField: "_id",
        as: "productThumb",
      },
    },
    {
      $unwind: "$productThumb",
    },
    {
      $lookup: {
        from: "warranties",
        localField: "orderedProducts.warranty",
        foreignField: "_id",
        as: "warranty",
      },
    },
    {
      $addFields: {
        warranty: {
          $cond: {
            if: { $eq: [{ $size: "$warranty" }, 0] },
            then: {
              warrantyCodes: null,
              createdAt: null,
            },
            else: { $arrayElemAt: ["$warranty", 0] },
          },
        },
      },
    },
    {
      $lookup: {
        from: "warranty_claim_histories", // Collection name for warranty claim histories
        localField: "orderedProducts.warrantyClaimHistory",
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
      $project: {
        _id: 1,
        orderId: 1,
        shipping: 1,
        product: {
          _id: "$orderedProducts._id",
          id: "$productInfo.id",
          productId: "$productInfo._id",
          title: "$productInfo.title",
          type: "$productInfo.type",
          image: {
            src: { $concat: [config.image_base_url, "/", "$productThumb.src"] },
            alt: "$productThumb.alt",
          },
          warranty: {
            duration: "$warranty.duration",
            startDate: "$warranty.startDate",
            endsDate: "$warranty.endsDate",
            warrantyCodes: "$warranty.warrantyCodes",
          },
          variation: "$orderedProducts.variation",
          attributes: "$orderedProducts.attributes",
          warrantyClaimHistory: "$warrantyClaimHistory",
          unitPrice: "$orderedProducts.unitPrice",
          quantity: "$orderedProducts.quantity",
        },
        createdAt: 1,
      },
    },
    {
      $match: {
        "product.warranty.warrantyCodes.code": { $in: warrantyCodes },
      },
    },
    {
      $group: {
        _id: "$_id",
        orderId: { $first: "$orderId" },
        shipping: { $first: "$shipping" },
        products: { $push: "$product" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        _id: 1,
        orderId: 1,
        products: 1,
        shipping: 1,
      },
    },
  ];
  const order = await Order.aggregate(pipeline);

  if (!order)
    throw new ApiError(httpStatus.BAD_REQUEST, "No warranty data found");
  return order;
};

const ifAlreadyClaimRequestPending = async (phoneNumber: string) => {
  const result = await WarrantyClaim.countDocuments({
    phoneNumber,
    contactStatus: "pending",
  });
  if (result) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "প্রিয় গ্রাহক, আপনার আরেকটি ওয়ারেন্টি দাবির অনুরোধ ইতিমধ্যেই মুলতুবি রয়েছে। সেই অনুরোধটি সম্পূর্ণ করার পরে, আপনি একটি নতুন ওয়ারেন্টি দাবি করতে পারবেন,ধন্যবাদ।"
    );
  }
};

const createReqID = () => createOrderId();

const validateWarranty = async ({
  phoneNumber,
  warrantyCodes,
}: {
  phoneNumber: string;
  warrantyCodes: string[];
}) => {
  const warranties = await WarrantyClaimUtils.getWarrantyData(
    phoneNumber,
    warrantyCodes
  );

  if (!warranties.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid request");
  }
  const warrantyClaimReqData: Record<string, unknown>[] = [];

  const allCodes: string[] = [];

  warranties.forEach((warranty) => {
    (
      warranty.products as {
        _id: Types.ObjectId;
        productId: Types.ObjectId;
        warranty: {
          warrantyCodes: { code: string }[];
          endsDate: string;
          duration?: string;
          startDate?: string;
        };
        variation: Types.ObjectId;
        attributes?: {
          [key: string]: string;
        };
        warrantyClaimHistory: Types.ObjectId;
        duration?: string;
        startDate?: string;
        endsDate?: string;
      }[]
    ).map((product) => {
      if (product?.warranty?.warrantyCodes)
        allCodes.push(
          ...product.warranty.warrantyCodes.map(({ code }) => code)
        );
      const endsDate = new Date(product?.warranty?.endsDate);

      const today = new Date();
      if (today > endsDate) {
        const expiredCodes = product.warranty.warrantyCodes
          .filter(({ code }) => warrantyCodes.includes(code))
          .map(({ code }) => code);
        const formattedEndsDate = `${endsDate}`
          .split(" ")
          .slice(1, 4)
          .join(" ");
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `The warranty for code${expiredCodes.length > 1 ? "s" : ""} -'${expiredCodes}' was valid till ${formattedEndsDate}`
        );
      }

      const data: Record<string, unknown> = {
        order_id: warranty._id,
      };

      data.orderItemId = product._id;
      data.productId = product.productId;
      data.variation = product.variation;
      data.warrantyClaimHistory = product.warrantyClaimHistory;
      data.attributes = Object.keys(product?.attributes || {})?.length
        ? product.attributes
        : undefined;
      data.prevWarrantyInformation = {
        duration: product?.warranty?.duration,
        startDate: product?.warranty?.startDate,
        endsDate: product?.warranty?.endsDate,
      };

      data.claimedCodes = product?.warranty?.warrantyCodes
        .map((item) =>
          warrantyCodes.includes(item.code) ? item.code : undefined
        )
        .filter(Boolean);
      warrantyClaimReqData.push(data);
    });
  });
  const notFoundCodes = warrantyCodes.filter(
    (item) => !allCodes.includes(item)
  );
  if (notFoundCodes.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `The provides code${notFoundCodes.length > 1 ? "s" : ""} -'${notFoundCodes}' was not found.`
    );
  }

  return warrantyClaimReqData;
};

export const WarrantyClaimUtils = {
  ifAlreadyClaimRequestPending,
  getWarrantyData,
  createReqID,
  validateWarranty,
};
