import httpStatus from "http-status";
import { PipelineStage, Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import generateSlug from "../../../utilities/generateSlug";
import { productStatus } from "../product/product.const";
import ProductModel from "../product/product.model";
import { commonPipelineMultipleProduct } from "../product/product.utils";
import { TCollection } from "./collection.interface";
import { CollectionModel } from "./collection.model";

const createCollectionIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TCollection
) => {
  if (!payload.slug) {
    payload.slug = generateSlug(payload.title);
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
              src: { $concat: [config.image_base_url, "/", "$src"] },
              alt: 1,
            },
          },
        ],
      },
    },
    { $unwind: { path: "$image", preserveNullAndEmptyArrays: true } },
    { $sort: { sortOrder: 1, createdAt: -1 } },
  ];

  const collectionQuery = new AggregateQueryHelper(
    CollectionModel.aggregate(pipeline),
    query
  )
    .search(["title"])
    .sort()
    .paginate();

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
    transform: (doc) => {
      if (doc) {
        return {
          ...doc.toObject(),
          src: `${config.image_base_url}/${doc.src}`,
        };
      }
      return doc;
    },
  });

  if (!collection) {
    throw new ApiError(httpStatus.NOT_FOUND, "Collection not found!");
  }

  // Fetch products associated with this collection
  // We need to replicate the product listing pipeline but filter by collection
  const productQuery = {
    productCollection: collection._id,
    isDeleted: false,
    publishedStatus: productStatus.published,
  };

  const productPipeline: PipelineStage[] = [
    { $match: productQuery },
    ...commonPipelineMultipleProduct,
    {
      $project: {
        title: 1,
        slug: 1,
        type: 1,
        variations: 1,
        regularPrice: "$price.regularPrice",
        salePrice: "$price.salePrice",
        sku: "$inventory.sku",
        stockStatus: "$inventory.stockStatus",
        stockAvailable: "$inventory.stockAvailable",
        thumbnail: {
          _id: "$thumbnail._id",
          src: "$thumbnail.src",
          alt: "$thumbnail.alt",
        },
        publishedStatus: 1,
      },
    },
  ];

  const products = await ProductModel.aggregate(productPipeline);

  return { ...collection.toObject(), products };
};

const updateCollectionIntoDB = async (
  id: string,
  payload: Partial<TCollection>
) => {
  if (payload.title) {
    payload.slug = generateSlug(payload.title);
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
