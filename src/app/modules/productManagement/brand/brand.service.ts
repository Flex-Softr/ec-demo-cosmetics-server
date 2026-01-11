import httpStatus from "http-status";
import { Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { TBrand } from "./brand.interface";
import { BrandModel } from "./brand.model";

const createBrandIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TBrand
) => {
  payload.createdBy = createdBy;
  const isBrandDeleted = await BrandModel.findOne({
    name: { $regex: new RegExp(payload.name, "i") },
    isDeleted: true,
  });

  if (isBrandDeleted) {
    const result = await BrandModel.findByIdAndUpdate(
      isBrandDeleted._id,
      { ...payload, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await BrandModel.create(payload);
    return result;
  }
};

const getAllBrandsFromDB = async (query?: Record<string, unknown>) => {
  const matchQuery: Record<string, unknown> = { isDeleted: false };
  if (query?.isActive) {
    matchQuery.isActive = query.isActive === "true";
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: "images",
        localField: "logo",
        foreignField: "_id",
        as: "logo",
      },
    },
    { $unwind: { path: "$logo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "products",
        let: { brandId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$brand", "$$brandId"] },
                  { $eq: ["$isDeleted", false] },
                ],
              },
            },
          },
          { $count: "count" },
        ],
        as: "productCount",
      },
    },
    {
      $addFields: {
        productCount: {
          $ifNull: [{ $arrayElemAt: ["$productCount.count", 0] }, 0],
        },
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        isActive: 1,
        logo: {
          _id: "$logo._id",
          src: { $concat: [config.image_base_url, "/", "$logo.src"] },
          alt: "$logo.alt",
        },
        productCount: 1,
      },
    },
  ];

  const result = await BrandModel.aggregate(pipeline);
  return result;
};

const updateBrandIntoDB = async (
  updatedBy: Types.ObjectId,
  id: string,
  payload: TBrand
) => {
  payload.updatedBy = updatedBy;

  const isBrandExist = await BrandModel.findById(id);

  if (!isBrandExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The brand was not found!");
  }

  if (isBrandExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The brand is deleted!");
  }
  const result = await BrandModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return result;
};

const deleteBrandFromDB = async (
  deletedBy: Types.ObjectId,
  brandIds: string[]
) => {
  const result = await BrandModel.updateMany(
    { _id: { $in: brandIds } },
    {
      $set: {
        deletedBy,
        isDeleted: true,
      },
    }
  );
  return result;
};

export const BrandServices = {
  createBrandIntoDB,
  getAllBrandsFromDB,
  updateBrandIntoDB,
  deleteBrandFromDB,
};
