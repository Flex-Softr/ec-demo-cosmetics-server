import mongoose from "mongoose";

export const findOrderWithWarrantyPipeline = (
  order_id: mongoose.Types.ObjectId
) => [
  { $match: { _id: new mongoose.Types.ObjectId(order_id) } },
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
    $project: {
      _id: 1,
      orderId: 1,
      deliveryStatus: 1,
      statusHistory: 1,
      product: {
        _id: "$orderedProducts._id",
        product: {
          _id: "$productInfo._id",
          title: "$productInfo.title",
          warranty: "$productInfo.warranty",
          warrantyInfo: "$productInfo.warrantyInfo",
        },
        prevWarrantyInformation: "$orderedProducts.prevWarrantyInformation",
        isWarrantyClaim: "$orderedProducts.isWarrantyClaim",
        warranty: {
          _id: "$warranty._id",
          warrantyCodes: "$warranty.warrantyCodes",
          createdAt: "$warranty.createdAt",
        },
        unitPrice: "$orderedProducts.unitPrice",
        quantity: "$orderedProducts.quantity",
        total: "$orderedProducts.total",
      },
      createdAt: 1,
    },
  },
  {
    $group: {
      _id: "$_id",
      orderId: { $first: "$orderId" },
      statusHistory: { $first: "$statusHistory" },
      products: { $push: "$product" },
      deliveryStatus: { $first: "$deliveryStatus" },
      createdAt: { $first: "$createdAt" },
    },
  },
];
