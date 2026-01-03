import httpStatus from "http-status";
import { Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { TCategory } from "./category.interface";
import { CategoryModel } from "./category.model";

const createCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TCategory
) => {
  payload.createdBy = createdBy;

  const isCategoryDeleted = await CategoryModel.findOne({
    name: { $regex: new RegExp(payload.name, "i") },
    isDeleted: true,
  });

  if (isCategoryDeleted) {
    const result = await CategoryModel.findByIdAndUpdate(
      isCategoryDeleted._id,
      { ...payload, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await CategoryModel.create(payload);
    return result;
  }
};

const getAllCategoriesFromDB = async (query?: Record<string, unknown>) => {
  const matchQuery: Record<string, unknown> = { isDeleted: false };
  if (query?.isActive) {
    matchQuery.isActive = query.isActive === "true";
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: "images",
        localField: "image",
        foreignField: "_id",
        as: "image",
      },
    },
    { $unwind: { path: "$image", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "subcategories",
        localField: "_id",
        foreignField: "category",
        as: "subCategory",
        pipeline: [
          { $match: { isDeleted: false } },
          { $project: { _id: 1, name: 1, slug: 1, description: 1 } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        image: {
          _id: "$image._id",
          src: { $concat: [config.image_base_url, "/", "$image.src"] },
          alt: "$image.alt",
        },
        description: 1,
        isActive: 1,
        subcategories: "$subCategory",
      },
    },
  ];
  const result = await CategoryModel.aggregate(pipeline);
  return result;
};

const updateCategoryIntoDB = async (
  updatedBy: Types.ObjectId,
  id: string,
  payload: TCategory
) => {
  payload.updatedBy = updatedBy;
  const isCategoryExist = await CategoryModel.findById(id);

  if (!isCategoryExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The category was not found!");
  }

  if (isCategoryExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The category is deleted!");
  }

  const result = await CategoryModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

const deleteCategoryFromDB = async (
  deletedBy: Types.ObjectId,
  categoryIds: string[]
) => {
  const result = await CategoryModel.updateMany(
    { _id: { $in: categoryIds } },
    {
      $set: {
        deletedBy,
        isDeleted: true,
      },
    }
  );

  return result;
};

export const CategoryServices = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};
