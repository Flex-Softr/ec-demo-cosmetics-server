/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import generateProductId from "../../../utilities/generateProductId";
import { InventoryModel } from "../inventory/inventory.model";
import PriceModel from "../price/price.model";
// import { SeoDataModel } from "../seoData/seoData.model";
import {
  AggregateQueryHelperFacet,
  ExtendedPipelineStage,
} from "../../../helper/query.helper";
import { Order } from "../../orderManagement/order/order.model";
import VariationModel from "../variation/variation.model";
import { PRODUCT_STATUS, PRODUCT_TYPE } from "./product.const";
import { TProductPayload } from "./product.interface";
import ProductModel from "./product.model";
import {
  calculateStockAvailable,
  commonPipelineMultipleProduct,
  commonPipelineSingleProduct,
  commonProductProjection,
  formatPriceUpdatePayload,
} from "./product.utils";

const createProductIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TProductPayload
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Initialize variables
    let price;
    let inventory;
    let variationIds: Types.ObjectId[] = [];

    const generatedProductId = await generateProductId();

    // 2. Logic based on Product Type
    if (payload.type === PRODUCT_TYPE.SIMPLE) {
      // --- Simple Product Logic ---

      // Create Price
      if (payload.price) {
        [price] = await PriceModel.create([payload.price], { session });
      }

      // Create Inventory
      if (payload.inventory) {
        [inventory] = await InventoryModel.create([payload.inventory], {
          session,
        });
      }

      // Ensure no variations or attributes for simple products
      payload.variations = [];
      payload.attributes = [];
    } else if (payload.type === PRODUCT_TYPE.VARIABLE) {
      // --- Variable Product Logic ---

      // Variations must exist
      if (payload.variations && payload.variations.length > 0) {
        // Collect all price and inventory payloads
        const pricePayloads = payload.variations.map((v) => v.price);
        const inventoryPayloads = payload.variations.map((v) => v.inventory);

        // Batch create prices and inventories
        const createdPrices = await PriceModel.insertMany(pricePayloads, {
          session,
        });
        const createdInventories = await InventoryModel.insertMany(
          inventoryPayloads,
          { session }
        );

        // Map back to variations
        const variationsData = payload.variations.map((v, i) => ({
          serial: i + 1,
          productId: generatedProductId,
          attributes: v.attributes,
          price: createdPrices[i]._id,
          inventory: createdInventories[i]._id,
          isActive: v.isActive,
        }));

        const insertedVariations = await VariationModel.insertMany(
          variationsData,
          { session }
        );
        variationIds = insertedVariations.map((v) => v._id);
      }

      // Root price and inventory remain undefined for variable products
    }

    // 4. Construct Final Product Object
    // Note: Attributes, Category, Brand, Image are passed directly.
    // 4. Construct Final Product Object
    // Note: Attributes, Category, Brand, Image are passed directly.
    let productData: any = {
      ...payload,
      id: generatedProductId,
      createdBy,
    };

    if (payload.type === PRODUCT_TYPE.SIMPLE) {
      productData = {
        ...productData,
        price: price?._id,
        inventory: inventory?._id,
        variations: [],
      };
    } else {
      productData = {
        ...productData,
        variations: variationIds,
        // Ensure properties not relevant to variable products are removed
        price: undefined,
        inventory: undefined,
      };
    }

    const isProductDeleted = await ProductModel.findOne({
      slug: payload.slug,
      isDeleted: true,
    });

    let product;

    if (isProductDeleted) {
      product = await ProductModel.findByIdAndUpdate(
        isProductDeleted._id,
        { ...productData, isDeleted: false },
        { new: true, session }
      );
    } else {
      [product] = await ProductModel.create([productData], { session });
    }

    await session.commitTransaction();
    return product;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getAProductCustomerFromDB = async (slug: string) => {
  const pipeline = [
    {
      $match: {
        slug: slug,
        isDeleted: false,
        publishedStatus: PRODUCT_STATUS.PUBLISHED,
      },
    },
    ...commonPipelineSingleProduct([
      {
        $match: {
          isActive: { $ne: false },
        },
      },
    ]),
  ];

  const result = await ProductModel.aggregate(pipeline as PipelineStage[]);

  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The product was not found!");
  }
  return result[0];
};

const getAProductAdminFromDB = async (id: string) => {
  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      },
    },
    ...commonPipelineSingleProduct(),
  ];

  const result = await ProductModel.aggregate(pipeline as PipelineStage[]);

  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The product was not found!");
  }

  return result[0];
};

const getAllProductsCustomerFromDB = async (query: Record<string, unknown>) => {
  let filterQuery: Record<string, unknown> = {};
  const { minPrice, maxPrice, category, subCategory, brand } = query;

  // Price filter
  if (minPrice && maxPrice) {
    filterQuery = {
      $expr: {
        $and: [
          { $gte: ["$price.salePrice", Number(minPrice)] },
          { $lte: ["$price.salePrice", Number(maxPrice)] },
        ],
      },
    };
  }

  const filterConditions = [];

  // Category filter
  if (typeof category === "string") {
    const categoryArray = category?.split(",") || []; // Split the comma-separated category slugs into an array
    if (categoryArray.length > 0) {
      filterConditions.push({ "category.slug": { $in: categoryArray } }); // Use $in to match any slug in the array
    }
  }

  // Subcategory filter
  if (typeof subCategory === "string") {
    const subcategoryArray = subCategory?.split(",") || []; // Split the comma-separated subcategory slugs into an array
    if (subcategoryArray.length > 0) {
      filterConditions.push({ "subcategory.slug": { $in: subcategoryArray } });
    }
  }

  // Brand filter
  if (typeof brand === "string") {
    const brandArray = brand?.split(",") || []; // Split the comma-separated brand slugs into an array
    if (brandArray.length > 0) {
      filterQuery["brand.slug"] = { $in: brandArray };
    }
  }

  // Collection filter
  if (typeof query.collection === "string") {
    const collectionArray = query.collection?.split(",") || [];
    if (collectionArray.length > 0) {
      filterQuery["productCollection.slug"] = { $in: collectionArray };
    }
  }

  // Apply $or for category or subcategory
  if (filterConditions.length > 0) {
    filterQuery["$or"] = filterConditions; // Match either category or subcategory
  }

  const pipeline: ExtendedPipelineStage[] = [
    {
      $match: {
        isDeleted: false,
        publishedStatus: PRODUCT_STATUS.PUBLISHED,
      },
    },
    ...commonPipelineMultipleProduct,
    { $match: filterQuery },
    {
      $facet: {
        // Define sub-pipeline 2: For other operations
        data: [
          {
            $project: commonProductProjection,
          },
        ],
        // Define sub-pipeline 1: For getting total count
        total: [
          {
            $count: "total",
          },
        ],
      },
    },
    { $unwind: "$total" },
    {
      $project: {
        data: 1,
        total: "$total.total",
      },
    },
  ];

  const productQuery = new AggregateQueryHelperFacet(
    ProductModel,
    pipeline,
    query
  )
    .search([
      "title",
      "inventory.salePrice",
      "inventory.sku",
      "description",
      "category.name",
      "subcategory.name",
      "brand.name",
    ])
    .sort()
    .paginate();

  const data = await productQuery.metaData();

  return { ...data };
};

const getAllProductsAdminFromDB = async (query: Record<string, unknown>) => {
  const filterQuery: Record<string, unknown> = {};
  const andConditions: Record<string, unknown>[] = [];

  if (
    (query.status && query.status === PRODUCT_STATUS.PUBLISHED) ||
    query.status === PRODUCT_STATUS.DRAFT ||
    query.status === PRODUCT_STATUS.PRIVATE
  ) {
    const statusRegex = new RegExp(`\\b${query.status}\\b`, "i");
    andConditions.push({ publishedStatus: statusRegex });
  }

  // Category or Subcategory ID filter
  if (query.category) {
    const categoryId = new mongoose.Types.ObjectId(query.category as string); // Convert the category query to ObjectId
    andConditions.push({
      $or: [{ "category._id": categoryId }, { "subcategory._id": categoryId }],
    });
  }

  if (query.collection) {
    const collectionId = new mongoose.Types.ObjectId(
      query.collection as string
    );
    andConditions.push({ "productCollection._id": collectionId });
  }

  if (query.stock) {
    const stockRegex = new RegExp(`\\b${query.stock}\\b`, "i");
    andConditions.push({
      $or: [
        { "inventory.stockStatus": stockRegex },
        { "variations.inventory.stockStatus": stockRegex },
      ],
    });
  }

  if (andConditions.length > 0) {
    filterQuery.$and = andConditions;
  }

  const pipeline = [
    { $match: { isDeleted: false } },
    ...commonPipelineMultipleProduct,
    { $match: filterQuery },
    {
      $facet: {
        // Define sub-pipeline 2: For other operations
        data: [
          {
            $project: {
              title: 1,
              type: 1,
              variations: 1,
              regularPrice: "$price.regularPrice",
              salePrice: "$price.salePrice",
              sku: "$inventory.sku",
              stockStatus: "$inventory.stockStatus",
              stockAvailable: "$inventory.stockAvailable",
              // totalReview: { $size: "$review" },
              // averageRating: { $avg: "$review.rating" },
              thumbnail: {
                _id: "$thumbnail._id",
                src: "$thumbnail.src",
                alt: "$thumbnail.alt",
              },
              category: {
                _id: "$category._id",
                name: "$category.name",
              },
              productCollection: {
                _id: "$productCollection._id",
                title: "$productCollection.title",
              },
              // subCategory: {
              //   $map: {
              //     input: "$subcategory",
              //     as: "sub",
              //     in: {
              //       _id: "$$sub._id",
              //       name: "$$sub.name",
              //     },
              //   },
              // },
              publishedStatus: 1,
            },
          },
        ],
        // Define sub-pipeline 1: For getting total count
        total: [
          {
            $count: "total",
          },
        ],
      },
    },
    { $unwind: "$total" },
    {
      $project: {
        data: 1,
        total: "$total.total",
      },
    },
  ];

  // get counts
  const statusMap = {
    all: 0,
    [PRODUCT_STATUS.PUBLISHED]: 0,
    [PRODUCT_STATUS.DRAFT]: 0,
    [PRODUCT_STATUS.PRIVATE]: 0,
  };

  const statusPipeline = [
    {
      $match: {
        isDeleted: false,
        publishedStatus: {
          $in: Object.values(PRODUCT_STATUS),
        },
      },
    },
    {
      $group: {
        _id: "$publishedStatus",
        total: { $sum: 1 },
      },
    },
  ];

  const result = await ProductModel.aggregate(statusPipeline);

  result.forEach(({ _id, total }: { _id: string; total: number }) => {
    if (_id in statusMap) {
      statusMap[_id as keyof typeof statusMap] = total;
    }
    statusMap.all += total;
  });

  const formattedResult = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));

  const productQuery = new AggregateQueryHelperFacet(
    ProductModel,
    pipeline as any,
    query
  )
    .search([
      "title",
      "inventory.salePrice",
      "inventory.sku",
      "description",
      "category.name",
      "subcategory.name",
      "brand.name",
    ])
    .sort()
    .paginate();

  const data = await productQuery.metaData();

  return { ...data, countsByStatus: formattedResult };
};

const getFeaturedProductsFromDB = async (query: Record<string, unknown>) => {
  const pipeline = [
    {
      $match: {
        isDeleted: false,
        featured: true,
        publishedStatus: PRODUCT_STATUS.PUBLISHED,
      },
    },
    ...commonPipelineMultipleProduct,
    {
      $project: commonProductProjection,
    },
  ];

  const productQuery = new AggregateQueryHelper(
    ProductModel.aggregate(pipeline as any),
    query
  ).paginate();

  const data = await productQuery.model;
  const total = (await ProductModel.aggregate(pipeline as any)).length;
  const meta = productQuery.metaData(total);
  return { meta, data };
};

const getBestSellingProductsFromDB = async (query: Record<string, unknown>) => {
  const pipeline: PipelineStage[] = [
    {
      $match: { status: { $ne: "deleted" } },
    },
    {
      $unwind: "$orderedProducts",
    },
    {
      $group: {
        _id: "$orderedProducts.product",
        totalQuantity: { $sum: "$orderedProducts.quantity" },
      },
    },
    {
      $sort: { totalQuantity: -1 },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $lookup: {
        from: "prices",
        localField: "product.price",
        foreignField: "_id",
        as: "price",
      },
    },
    {
      $unwind: "$price",
    },
    {
      $lookup: {
        from: "images",
        localField: "product.image.thumbnail",
        foreignField: "_id",
        as: "thumbnail",
      },
    },
    {
      $unwind: "$thumbnail",
    },
    {
      $lookup: {
        from: "categories",
        localField: "product.category.name",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $lookup: {
        from: "inventories",
        localField: "product.inventory",
        foreignField: "_id",
        as: "inventory",
      },
    },
    {
      $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "variations",
        localField: "product.variations",
        foreignField: "_id",
        as: "variations",
        pipeline: [
          { $sort: { serial: 1 } },
          {
            $lookup: {
              from: "prices",
              localField: "price",
              foreignField: "_id",
              as: "price",
              pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }] as any[],
            },
          },
          { $unwind: { path: "$price", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "inventories",
              localField: "inventory",
              foreignField: "_id",
              as: "inventory",
              pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }] as any[],
            },
          },
          { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ] as any[],
      },
    },
    // {
    //   $lookup: {
    //     from: "reviews",
    //     localField: "_id",
    //     foreignField: "product",
    //     as: "review",
    //   },
    // },
    // Project specific fields
    {
      $addFields: {
        title: "$product.title",
        slug: "$product.slug",
        type: "$product.type",
      },
    },
    {
      $project: commonProductProjection,
    },
  ];

  const productQuery = new AggregateQueryHelper(
    Order.aggregate(pipeline),
    query
  ).paginate();

  const data = await productQuery.model;
  const total = (await Order.aggregate(pipeline)).length;
  const meta = productQuery.metaData(total);
  return { meta, data };
};

const getRelatedProductsFromDB = async (slug: string) => {
  const product = await ProductModel.findOne({ slug, isDeleted: false });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found!");
  }

  if (!product.relatedProducts || product.relatedProducts.length === 0) {
    return [];
  }

  const pipeline = [
    {
      $match: {
        _id: { $in: product.relatedProducts },
        isDeleted: false,
        publishedStatus: PRODUCT_STATUS.PUBLISHED,
      },
    },
    ...commonPipelineMultipleProduct,
    {
      $project: commonProductProjection,
    },
  ];

  const result = await ProductModel.aggregate(pipeline as PipelineStage[]);

  return result;
};

const updateProductIntoDB = async (
  updatedBy: Types.ObjectId,
  id: string,
  payload: Partial<TProductPayload>
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const {
      price,
      image,
      inventory,
      // seoData,
      publishedStatus,
      attributes,
      brand,
      category,
      warrantyInfo,
      // tag,
      variations,
      ...remainingUpdateData
    } = payload;
    const isProductExist = await ProductModel.findById(id);

    if (!isProductExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "The Product was not found!");
    }

    if (isProductExist.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, "The Product is deleted!");
    }
    if (
      isProductExist.publishedStatus == PRODUCT_STATUS.PUBLISHED &&
      publishedStatus == PRODUCT_STATUS.DRAFT
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Published product can not be Draft! Make it private to hide it from customers."
      );
    }

    // Determine the target type for this update
    // If type is in payload use it, otherwise use existing type
    const productType = payload.type || isProductExist.type;

    // --- Simple Product Logic ---
    if (productType === PRODUCT_TYPE.SIMPLE) {
      if (price && Object.keys(price).length) {
        const updatePrice = formatPriceUpdatePayload(price);
        await PriceModel.findByIdAndUpdate(
          isProductExist.price,
          { $set: { ...updatePrice, updatedBy } },
          { session }
        );
      }

      if (inventory && Object.keys(inventory).length) {
        if (inventory.stockQuantity !== undefined) {
          const existingInventory = await InventoryModel.findById(
            isProductExist.inventory
          );
          if (
            existingInventory &&
            existingInventory.stockQuantity !== undefined
          ) {
            inventory.stockAvailable = calculateStockAvailable(
              inventory.stockQuantity,
              existingInventory.stockQuantity,
              existingInventory.stockAvailable || 0
            );
          }
        }

        await InventoryModel.findByIdAndUpdate(
          isProductExist.inventory,
          { $set: { ...inventory, updatedBy } },
          { session }
        );
      }
    }

    const variationIds: Types.ObjectId[] = [];

    // --- Variable Product Logic ---
    if (productType === PRODUCT_TYPE.VARIABLE) {
      let index = 0;

      if (variations && variations.length > 0) {
        const priceBulkOps: any[] = [];
        const inventoryBulkOps: any[] = [];
        const variationBulkOps: any[] = [];
        const newVariationsData: any[] = [];

        // Fetch existing variations map for O(1) lookup
        const existingVariationModels = await VariationModel.find({
          productId: isProductExist.id,
        }).lean();

        const existingVariationMap = new Map(
          existingVariationModels.map((v) => [v._id.toString(), v])
        );

        // Fetch all related inventory documents for variations to avoid N+1 queries
        const variationInventoryIds = existingVariationModels.map(
          (v) => v.inventory
        );
        const existingInventories = await InventoryModel.find({
          _id: { $in: variationInventoryIds },
        }).lean();

        const inventoryMap = new Map(
          existingInventories.map((inv) => [inv._id.toString(), inv])
        );

        // Also map by attributes to help find match if ID is missing (legacy support)
        // Note: Object matching key order matters, simplistically using stringify here
        // but ideally should be robust. Given structure, ID match is preferred.

        for (const variation of variations) {
          const serial = index + 1;
          const {
            price: variationPrice,
            inventory: variationInventory,
            _id: variationId,
            ...variationData
          } = variation as any;

          let existingVariation: any = null;

          if (variationId && existingVariationMap.has(variationId)) {
            existingVariation = existingVariationMap.get(variationId);
          } else if (variationId) {
            // Fallback if not in map but ID provided (rare race condition or fetch gap)
            existingVariation = await VariationModel.findById(variationId);
          }

          if (!existingVariation) {
            // Fallback to attribute match if no ID
            existingVariation = await VariationModel.findOne({
              productId: isProductExist.id,
              attributes: variationData.attributes,
            });
          }

          if (existingVariation) {
            // Update existing variation
            if (variationPrice) {
              const updatePrice = formatPriceUpdatePayload(variationPrice);
              priceBulkOps.push({
                updateOne: {
                  filter: { _id: existingVariation.price },
                  update: updatePrice,
                },
              });
            }
            if (variationInventory) {
              // Calculate stock logic for variations
              if (variationInventory.stockQuantity !== undefined) {
                const currentInv = inventoryMap.get(
                  existingVariation.inventory.toString()
                );
                if (currentInv && currentInv.stockQuantity !== undefined) {
                  variationInventory.stockAvailable = calculateStockAvailable(
                    variationInventory.stockQuantity,
                    currentInv.stockQuantity,
                    currentInv.stockAvailable || 0
                  );
                }
              }

              inventoryBulkOps.push({
                updateOne: {
                  filter: { _id: existingVariation.inventory },
                  update: variationInventory,
                },
              });
            }

            variationBulkOps.push({
              updateOne: {
                filter: { _id: existingVariation._id },
                update: { $set: { serial, ...variationData } },
              },
            });
            variationIds.push(existingVariation._id);
          } else {
            // Create new variation data structure to hold temporarily
            // We need separate Price and Inventory documents first
            // Since insertMany returns docs with IDs, we can't easily bulkWrite the dependent Variation *before* we have IDs.
            // BUT, we can generate IDs manually or just use single creates for NEW items (usually few)
            // or use insertMany for the batch of new items.

            // Let's collect new items to batch create them
            newVariationsData.push({
              serial,
              pricePayload: variationPrice,
              inventoryPayload: variationInventory,
              variationPayload: variationData,
            });
          }

          index++;
        }

        // Execute Bulk Updates
        if (priceBulkOps.length)
          await PriceModel.bulkWrite(priceBulkOps, { session });
        if (inventoryBulkOps.length)
          await InventoryModel.bulkWrite(inventoryBulkOps, { session });
        if (variationBulkOps.length)
          await VariationModel.bulkWrite(variationBulkOps, { session });

        // Handle New Variations Batch Creation
        if (newVariationsData.length > 0) {
          const newPrices = await PriceModel.insertMany(
            newVariationsData.map((v) => v.pricePayload),
            { session }
          );
          const newInventories = await InventoryModel.insertMany(
            newVariationsData.map((v) => v.inventoryPayload),
            { session }
          );

          const finalNewVariations = newVariationsData.map((v, idx) => ({
            productId: isProductExist.id,
            serial: v.serial,
            price: newPrices[idx]._id,
            inventory: newInventories[idx]._id,
            ...v.variationPayload,
          }));

          const createdVariations = await VariationModel.insertMany(
            finalNewVariations,
            { session }
          );
          createdVariations.forEach((v) => variationIds.push(v._id));
        }
      }
    }

    // if (seoData && Object.keys(seoData).length) {
    //   await SeoDataModel.findByIdAndUpdate(
    //     isProductExist.seoData,
    //     { $set: { ...seoData, updatedBy } },
    //     { session }
    //   );
    // }

    const updateImage: Record<string, unknown> = {};
    if (image && Object.keys(image).length) {
      for (const [key, value] of Object.entries(image)) {
        updateImage[`image.${key}`] = value;
      }
    }
    const updateCategory: Record<string, unknown> = {};
    if (category && Object.keys(category).length) {
      for (const [key, value] of Object.entries(category)) {
        updateCategory[`category.${key}`] = value;
      }
    }
    const updateWarrantyInfo: Record<string, unknown> = {};
    if (warrantyInfo && Object.keys(warrantyInfo).length) {
      for (const [key, value] of Object.entries(warrantyInfo)) {
        updateWarrantyInfo[`warrantyInfo.${key}`] = value;
      }
    }

    let updateAttribute, updateBrand, updateTag;

    // Only update attributes if type is variable
    if (productType === PRODUCT_TYPE.VARIABLE && attributes?.length) {
      updateAttribute = attributes;
    }

    if (brand) {
      updateBrand = brand;
    }
    // if (tag?.length) {
    //   updateTag = tag;
    // }

    const product = await ProductModel.findByIdAndUpdate(
      isProductExist._id,
      {
        $set: {
          ...updateImage,
          attributes: updateAttribute,
          brand: updateBrand,
          ...updateCategory,
          tag: updateTag,
          variations: variationIds,
          ...updateWarrantyInfo,
          // ...updatePublishedStatus,
          ...(publishedStatus && { publishedStatus }),
          ...remainingUpdateData,
          updatedBy,
        },
      },
      { session, new: true }
    );

    await session.commitTransaction();
    return product;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const deleteProductFromDB = async (
  productIds: string[],
  deletedBy: Types.ObjectId
) => {
  const result = await ProductModel.updateMany(
    { _id: { $in: productIds } },
    {
      $set: {
        deletedBy,
        isDeleted: true,
      },
    }
  );

  return result;
};

export const ProductServices = {
  createProductIntoDB,
  getAProductCustomerFromDB,
  getAProductAdminFromDB,
  getAllProductsCustomerFromDB,
  getAllProductsAdminFromDB,
  getFeaturedProductsFromDB,
  getBestSellingProductsFromDB,
  getRelatedProductsFromDB,
  updateProductIntoDB,
  deleteProductFromDB,
};
