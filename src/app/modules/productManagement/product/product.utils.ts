/* eslint-disable @typescript-eslint/no-explicit-any */
import { CronJob } from "cron";
import { Request } from "express";
import { PipelineStage } from "mongoose";
import { InventoryModel } from "../inventory/inventory.model";
import PriceModel from "../price/price.model";
import ProductModel from "./product.model";

const modifiedPriceData = (req: Request) => {
  const { price } = req.body;
  const save = price.regularPrice - price.salePrice || 0;
  price.priceSave = save === price.regularPrice ? 0 : save;
  const calculatedPrice: Record<string, unknown> = {};
  if (price && price.salePrice) {
    calculatedPrice.discountPercent = Number(
      (
        ((price.regularPrice - price.salePrice) / price.regularPrice) *
        100
      ).toFixed(2)
    );
    req.body.price = { ...price, ...calculatedPrice };
    return;
  }
  if (price && price.discountPercent) {
    calculatedPrice.salePrice = Number(
      (
        price.regularPrice -
        price.regularPrice * (price.discountPercent / 100)
      ).toFixed(2)
    );
    req.body.price = {
      ...price,
      ...calculatedPrice,
    };
  }
  if (!calculatedPrice.salePrice) {
    calculatedPrice.salePrice = price.regularPrice;
    req.body.price = {
      ...price,
      ...calculatedPrice,
    };
  }
};

export default modifiedPriceData;

// Cron job to run every day at midnight
export const deleteDraftProducts = new CronJob(
  "0 0 * * *", // Every day at midnight
  async () => {
    const currentDate = new Date();
    // Find products where status is 'Draft' and created more than 30 days ago
    const draftProducts = await ProductModel.find({
      "publishedStatus.status": "Draft",
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

export const commonPipelineSingleProduct = (
  pipeline: PipelineStage[] | undefined = []
): PipelineStage[] => [
  {
    $lookup: {
      from: "images",
      localField: "image.thumbnail",
      foreignField: "_id",
      as: "thumbnail",
      pipeline: [{ $project: { src: 1, alt: 1 } }],
    },
  },
  {
    $lookup: {
      from: "images",
      localField: "image.gallery",
      foreignField: "_id",
      as: "gallery",
      pipeline: [{ $project: { src: 1, alt: 1 } }],
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
      localField: "category.name",
      foreignField: "_id",
      as: "myCategory",
      // pipeline: [{ $project: { name: 1 } }],
    },
  },
  {
    $lookup: {
      from: "subcategories",
      localField: "category.subCategory",
      foreignField: "_id",
      as: "subCategory",
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
    $unwind: "$thumbnail",
  },
  {
    $unwind: { path: "$price", preserveNullAndEmptyArrays: true },
  },
  {
    $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true },
  },
  {
    $unwind: "$myCategory",
  },
  {
    $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true },
  },
  {
    $unwind: { path: "$brand", preserveNullAndEmptyArrays: true },
  },
  {
    $project: {
      _id: 1,
      id: 1,
      title: 1,
      slug: 1,
      type: 1,
      description: 1,
      shortDescription: 1,
      additionalInfo: 1,
      usageGuidelines: 1,
      thumbnail: "$thumbnail",
      gallery: "$gallery",
      price: "$price",
      inventory: "$inventory",
      variations: "$variations",
      category: {
        _id: "$myCategory._id",
        name: "$myCategory.name",
        slug: "$myCategory.slug",
        subCategory: "$subCategory",
      },
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
      warranty: 1,
      warrantyInfo: 1,
      featured: 1,
      publishedStatus: 1,
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
      from: "subcategories",
      localField: "category.subCategory",
      foreignField: "_id",
      as: "subcategory",
    },
  },
  {
    $lookup: {
      from: "categories",
      localField: "category.name",
      foreignField: "_id",
      as: "category",
    },
  },
  { $unwind: "$category" },
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
