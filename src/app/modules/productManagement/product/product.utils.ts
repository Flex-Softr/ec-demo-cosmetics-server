/* eslint-disable @typescript-eslint/no-explicit-any */
import { CronJob } from "cron";
import { PipelineStage } from "mongoose";
import config from "../../../config/config";
import { STOCK_STATUS } from "../inventory/inventory.const";
import { InventoryModel } from "../inventory/inventory.model";
import PriceModel from "../price/price.model";
import { PRODUCT_STATUS, PRODUCT_TYPE } from "./product.const";
import ProductModel from "./product.model";

export const formatPriceUpdatePayload = (price: Record<string, any>) => {
  const updatePrice: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(price)) {
    updatePrice[key] = value;
  }
  return updatePrice;
};

export const calculateStockAvailable = (
  newStockQuantity: number,
  oldStockQuantity: number,
  oldStockAvailable: number
): number => {
  const diff = Number(newStockQuantity) - Number(oldStockQuantity);
  return (oldStockAvailable || 0) + diff;
};

// Cron job to run every day at midnight
export const deleteDraftProducts = new CronJob(
  "0 0 * * *", // Every day at midnight
  async () => {
    const currentDate = new Date();
    // Find products where status is 'Draft' and created more than 30 days ago
    const draftProducts = await ProductModel.find({
      publishedStatus: PRODUCT_STATUS.DRAFT,
      createdAt: {
        $lte: new Date(currentDate.setDate(currentDate.getDate() - 30)),
      },
    });

    if (draftProducts.length > 0) {
      const ids = draftProducts.map((product) => product._id);
      const priceIds = draftProducts.map((product) => product.price);
      const inventoryIds = draftProducts.map((product) => product.inventory);

      // Delete the products
      await ProductModel.deleteMany({ _id: { $in: ids } });
      await PriceModel.deleteMany({ _id: { $in: priceIds } });
      await InventoryModel.deleteMany({ _id: { $in: inventoryIds } });
    }
  },
  null, // No onComplete function needed
  true, // Start the job immediately
  "Asia/Dhaka" // Change this to your desired timezone
);

export const commonProductProjection = {
  _id: 1,
  title: 1,
  slug: 1,
  type: 1,
  createdAt: 1,
  updatedAt: 1,
  // variations: 1,
  // shortDescription: 1,

  // Pricing Logic with conditional handling for variable products
  regularPrice: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: "$$REMOVE",
      else: "$price.regularPrice",
    },
  },
  salePrice: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: "$$REMOVE",
      else: "$price.salePrice",
    },
  },
  discountPercent: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: "$$REMOVE",
      else: "$price.discountPercent",
    },
  },
  priceSave: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: "$$REMOVE",
      else: "$price.priceSave",
    },
  },
  // Variable Product Specific Fields
  minRegularPrice: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: { $min: "$variations.price.regularPrice" },
      else: "$$REMOVE",
    },
  },
  minSalePrice: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: { $min: "$variations.price.salePrice" },
      else: "$$REMOVE",
    },
  },
  maxRegularPrice: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: { $max: "$variations.price.regularPrice" },
      else: "$$REMOVE",
    },
  },
  maxSalePrice: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: { $max: "$variations.price.salePrice" },
      else: "$$REMOVE",
    },
  },
  minDiscountPercent: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: { $min: "$variations.price.discountPercent" },
      else: "$$REMOVE",
    },
  },
  maxDiscountPercent: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: { $max: "$variations.price.discountPercent" },
      else: "$$REMOVE",
    },
  },
  minPriceSave: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: { $ifNull: [{ $min: "$variations.price.priceSave" }, 0] },
      else: "$$REMOVE",
    },
  },
  maxPriceSave: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: { $ifNull: [{ $max: "$variations.price.priceSave" }, 0] },
      else: "$$REMOVE",
    },
  },

  // Stock Status Logic
  stockStatus: {
    $cond: {
      if: { $eq: ["$type", PRODUCT_TYPE.VARIABLE] },
      then: {
        $cond: {
          if: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$variations.inventory.stockStatus",
                    as: "status",
                    cond: {
                      $in: [
                        "$$status",
                        [STOCK_STATUS.IN_STOCK, STOCK_STATUS.LOW_STOCK],
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
          then: STOCK_STATUS.IN_STOCK,
          else: STOCK_STATUS.OUT_OF_STOCK,
        },
      },
      else: "$inventory.stockStatus", // Simple product logic
    },
  },
  // sku: "$inventory.sku",
  // stockAvailable: "$inventory.stockAvailable",
  // totalReview: { $size: "$review" },
  // averageRating: { $avg: "$review.rating" },
  thumbnail: {
    _id: "$thumbnail._id",
    src: "$thumbnail.src",
    alt: "$thumbnail.alt",
  },
  // category: {
  //   _id: "$category._id",
  //   name: "$category.name",
  //   slug: "$category.slug",
  // },
};

export const commonPipelineSingleProduct = (
  pipeline: PipelineStage[] | undefined = []
): PipelineStage[] => [
  {
    $lookup: {
      from: "images",
      localField: "image.thumbnail",
      foreignField: "_id",
      as: "thumbnail",
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
  {
    $lookup: {
      from: "images",
      localField: "image.gallery",
      foreignField: "_id",
      as: "gallery",
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
  {
    $lookup: {
      from: "prices",
      localField: "price",
      foreignField: "_id",
      as: "price",
      pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }],
    },
  },
  {
    $lookup: {
      from: "inventories",
      localField: "inventory",
      foreignField: "_id",
      as: "inventory",
      pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }],
    },
  },
  {
    $lookup: {
      from: "variations",
      localField: "variations",
      foreignField: "_id",
      as: "variations",
      pipeline: [
        ...(pipeline || []),
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
        {
          $unwind: { path: "$price", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "inventories",
            localField: "inventory",
            foreignField: "_id",
            as: "inventory",
            pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }] as any[],
          },
        },
        {
          $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            createdAt: 0,
            updatedAt: 0,
          },
        },
      ] as any[],
    },
  },
  {
    $lookup: {
      from: "categories",
      localField: "category",
      foreignField: "_id",
      as: "category",
      pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
    },
  },
  {
    $lookup: {
      from: "attributes",
      localField: "attributes.name",
      foreignField: "_id",
      as: "myAttributes",
      pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }],
    },
  },
  {
    $lookup: {
      from: "brands",
      localField: "brand",
      foreignField: "_id",
      as: "brand",
      pipeline: [{ $project: { name: 1, slug: 1 } }],
    },
  },
  {
    $lookup: {
      from: "collections",
      localField: "productCollection",
      foreignField: "_id",
      as: "productCollection",
      pipeline: [{ $project: { title: 1, slug: 1 } }],
    },
  },
  {
    $unwind: "$thumbnail",
  },
  {
    $unwind: { path: "$price", preserveNullAndEmptyArrays: true },
  },
  {
    $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true },
  },
  {
    $unwind: { path: "$brand", preserveNullAndEmptyArrays: true },
  },
  // {
  //   $unwind: { path: "$productCollection", preserveNullAndEmptyArrays: true },
  // },
  {
    $project: {
      _id: 1,
      id: 1,
      title: 1,
      slug: 1,
      type: 1,
      featured: 1,
      shortDescription: 1,
      description: 1,
      // additionalInfo: 1,
      // usageGuidelines: 1,
      thumbnail: "$thumbnail",
      gallery: "$gallery",
      price: "$price",
      inventory: "$inventory",
      variations: "$variations",
      category: "$category",
      attributes: {
        $map: {
          input: "$myAttributes",
          as: "a",
          in: {
            _id: "$$a._id",
            name: "$$a.name",
            values: {
              $filter: {
                input: "$$a.values",
                as: "value",
                cond: {
                  $in: [
                    "$$value._id",
                    {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: "$attributes",
                                as: "s",
                                cond: { $eq: ["$$s.name", "$$a._id"] },
                              },
                            },
                            as: "sa",
                            in: "$$sa.values",
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      brand: "$brand",
      productCollection: "$productCollection",
      relatedProducts: 1,
      warranty: 1,
      warrantyInfo: 1,
      publishedStatus: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  },
];

export const commonPipelineMultipleProduct: PipelineStage[] = [
  {
    $lookup: {
      from: "prices",
      localField: "price",
      foreignField: "_id",
      as: "price",
    },
  },
  {
    $unwind: { path: "$price", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "images",
      localField: "image.thumbnail",
      foreignField: "_id",
      as: "thumbnail",
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
  {
    $unwind: "$thumbnail",
  },
  {
    $lookup: {
      from: "inventories",
      localField: "inventory",
      foreignField: "_id",
      as: "inventory",
    },
  },
  {
    $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "categories",
      localField: "category",
      foreignField: "_id",
      as: "category",
      pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
    },
  },
  {
    $lookup: {
      from: "variations",
      localField: "variations",
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
        {
          $unwind: { path: "$price", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "inventories",
            localField: "inventory",
            foreignField: "_id",
            as: "inventory",
            pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }] as any[],
          },
        },
        {
          $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            createdAt: 0,
            updatedAt: 0,
          },
        },
      ] as any[],
    },
  },
  {
    $lookup: {
      from: "brands",
      localField: "brand",
      foreignField: "_id",
      as: "brand",
      pipeline: [{ $project: { name: 1, slug: 1 } }],
    },
  },
  {
    $unwind: { path: "$brand", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "collections",
      localField: "productCollection",
      foreignField: "_id",
      as: "productCollection",
      pipeline: [{ $project: { title: 1, slug: 1 } }],
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
];

export const stripHtmlAndEntities = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .trim();
};
