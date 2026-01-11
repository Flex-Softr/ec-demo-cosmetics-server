import httpStatus from "http-status";
import { Types } from "mongoose";
import config from "../../../config/config";
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

  if (query?.category) {
    matchQuery.category = new Types.ObjectId(query.category as string);
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
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
        from: "products",
        let: { subCategoryId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$category.subCategory", "$$subCategoryId"] },
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
        category: {
          name: "$category.name",
          slug: "$category.slug",
          image: "$category.image",
          description: "$category.description",
        },
        image: {
          _id: "$image._id",
          src: { $concat: [config.image_base_url, "/", "$image.src"] },
          alt: "$image.alt",
          uploadedBy: "$image.uploadedBy",
          isDeleted: "$image.isDeleted",
          createdAt: "$image.createdAt",
          updatedAt: "$image.updatedAt",
        },
        productCount: 1,
      },
    },
  ];

  const result = await SubCategoryModel.aggregate(pipeline);
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
    category: new Types.ObjectId(categoryId),
    isDeleted: false,
  };
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
        from: "products",
        let: { subCategoryId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$category.subCategory", "$$subCategoryId"] },
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
        category: 1, // Keep category ID as per original find/populate intuition or project as needed. Original populated category but with select keys? No, original didn't populate category in this function.
        // Wait, original: .find(..., "... category").populate({path: "image"...})
        // It selected "category" field (the ID) but didn't populate it.
        // So we just keep it.
        image: {
          _id: "$image._id",
          src: { $concat: [config.image_base_url, "/", "$image.src"] },
          alt: "$image.alt",
          uploadedBy: "$image.uploadedBy",
          isDeleted: "$image.isDeleted",
          createdAt: "$image.createdAt",
          updatedAt: "$image.updatedAt",
        },
        productCount: 1,
      },
    },
  ];

  const result = await SubCategoryModel.aggregate(pipeline);
  return result;
};

export const SubCategoryServices = {
  createSubCategoryIntoDB,
  getAllSubCategoriesFromDB,
  updateSubCategoryIntoDB,
  deleteSubCategoryFromDB,
  getSubCategoriesByCategoryFromDB,
};
