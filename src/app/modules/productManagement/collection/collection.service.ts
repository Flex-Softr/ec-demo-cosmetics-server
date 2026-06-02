import httpStatus from "http-status";
import { PipelineStage, Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import generateSlug from "../../../utilities/generateSlug";
import { PRODUCT_STATUS } from "../product/product.const";
import ProductModel from "../product/product.model";
import {
  commonPipelineMultipleProduct,
  commonProductProjection,
} from "../product/product.utils";
import { TCollection } from "./collection.interface";
import { CollectionModel } from "./collection.model";

const createCollectionIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TCollection
) => {
  if (!payload.slug) {
    payload.slug = generateSlug(payload.name);
  } else {
    payload.slug = generateSlug(payload.slug);
  }

  const result = await CollectionModel.create({ ...payload, createdBy });
  return result;
};

const getAllCollectionsFromDB = async (query: Record<string, unknown>) => {
  const matchStage: Record<string, unknown> = { isDeleted: false };

  if (query.isActive) {
    matchStage.isActive = query.isActive === "true";
  }

  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    {
      $lookup: {
        from: "images",
        localField: "image",
        foreignField: "_id",
        as: "image",
        pipeline: [
          {
            $project: {
              src: "$src",
              alt: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "products",
        let: { collectionId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $in: [
                      "$$collectionId",
                      { $ifNull: ["$productCollection", []] },
                    ],
                  },
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
    { $unwind: { path: "$image", preserveNullAndEmptyArrays: true } },
    { $sort: { sortOrder: 1, createdAt: -1 } },
  ];

  const collectionQuery = new AggregateQueryHelper(
    CollectionModel.aggregate(pipeline),
    query
  ).search(["name"]);

  if (query.sort) {
    collectionQuery.sort();
  }

  collectionQuery.paginate();

  const data = await collectionQuery.model;
  const total = (await CollectionModel.aggregate(pipeline)).length;
  const meta = collectionQuery.metaData(total);

  return { meta, data };
};

const getSingleCollectionFromDB = async (slug: string) => {
  const query = Types.ObjectId.isValid(slug)
    ? { _id: slug, isDeleted: false }
    : { slug, isDeleted: false };

  const collection = await CollectionModel.findOne(query).populate({
    path: "image",
    select: "src alt",
  });

  if (!collection) {
    throw new ApiError(httpStatus.NOT_FOUND, "Collection not found!");
  }

  // Fetch products associated with this collection
  // We need to replicate the product listing pipeline but filter by collection
  const productQuery = {
    productCollection: collection._id,
    isDeleted: false,
    publishedStatus: PRODUCT_STATUS.PUBLISHED,
  };

  const productPipeline: PipelineStage[] = [
    { $match: productQuery },
    ...commonPipelineMultipleProduct,
    {
      $project: commonProductProjection,
    },
  ];

  const products = await ProductModel.aggregate(productPipeline);

  return { ...collection.toObject(), products };
};

const updateCollectionIntoDB = async (
  id: string,
  payload: Partial<TCollection>
) => {
  if (payload.name) {
    payload.slug = generateSlug(payload.name);
  }

  const result = await CollectionModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Collection not found!");
  }
  return result;
};

const deleteCollectionFromDB = async (id: string) => {
  const result = await CollectionModel.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Collection not found!");
  }
  return result;
};

export const CollectionServices = {
  createCollectionIntoDB,
  getAllCollectionsFromDB,
  getSingleCollectionFromDB,
  updateCollectionIntoDB,
  deleteCollectionFromDB,
};
