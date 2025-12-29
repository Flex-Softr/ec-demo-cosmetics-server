import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { ImageModel } from "../../image/image.model";
import { CategoryModel } from "../category/category.model";
import { TSubCategory } from "./subCategory.interface";
import { SubCategoryModel } from "./subCategory.model";

const createSubCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TSubCategory
) => {
  payload.createdBy = createdBy;

  const isCategoryExist = await CategoryModel.findById(payload.category);
  if (!isCategoryExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The category was not found!");
  }
  if (isCategoryExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The category is deleted!");
  }
  if (payload.image) {
    const isImageExist = await ImageModel.findById(payload.image);
    if (!isImageExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "The image was not found!");
    }
    if (isImageExist.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, "The image is deleted!");
    }
  }

  const isSubCategoryDeleted = await SubCategoryModel.findOne({
    name: { $regex: new RegExp(payload.name, "i") },
    isDeleted: true,
  });

  if (isSubCategoryDeleted) {
    const result = await SubCategoryModel.findByIdAndUpdate(
      isSubCategoryDeleted._id,
      { ...payload, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await SubCategoryModel.create(payload);
    return result;
  }
};

const getAllSubCategoriesFromDB = async (query?: Record<string, unknown>) => {
  const matchQuery: Record<string, unknown> = { isDeleted: false };
  if (query?.isActive) {
    matchQuery.isActive = query.isActive === "true";
  }
  const result = await SubCategoryModel.find(
    matchQuery,
    "name slug image description isActive"
  ).populate("category", "name slug image description");
  return result;
};

const updateSubCategoryIntoDB = async (
  updatedBy: Types.ObjectId,
  id: string,
  payload: TSubCategory
) => {
  payload.updatedBy = updatedBy;

  const isSubCategoryExist = await SubCategoryModel.findById(id);
  if (!isSubCategoryExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The sub category was not found!");
  }

  if (isSubCategoryExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The sub category is deleted!");
  }

  const result = await SubCategoryModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

const deleteSubCategoryFromDB = async (
  deletedBy: Types.ObjectId,
  subCategoryIds: string[]
) => {
  const result = await SubCategoryModel.updateMany(
    { _id: { $in: subCategoryIds } },
    {
      $set: {
        deletedBy,
        isDeleted: true,
      },
    }
  );

  return result;
};

const getSubCategoriesByCategoryFromDB = async (
  categoryId: string,
  query?: Record<string, unknown>
) => {
  const matchQuery: Record<string, unknown> = {
    category: categoryId,
    isDeleted: false,
  };
  if (query?.isActive) {
    matchQuery.isActive = query.isActive === "true";
  }

  const result = await SubCategoryModel.find(
    matchQuery,
    "name slug image description isActive category"
  ).populate({
    path: "image",
    select: "_id src alt uploadedBy isDeleted createdAt updatedAt",
  });

  return result;
};

export const SubCategoryServices = {
  createSubCategoryIntoDB,
  getAllSubCategoriesFromDB,
  updateSubCategoryIntoDB,
  deleteSubCategoryFromDB,
  getSubCategoriesByCategoryFromDB,
};
