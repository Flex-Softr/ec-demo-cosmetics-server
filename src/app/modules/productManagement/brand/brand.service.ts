import httpStatus from "http-status";
import { Types } from "mongoose";
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

  const result = await BrandModel.find(
    matchQuery,
    "name slug description isActive"
  ).populate("logo", "_id src alt");
  return result;
};

const updateBrandIntoDB = async (
  createdBy: Types.ObjectId,
  id: string,
  payload: TBrand
) => {
  payload.createdBy = createdBy;
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
