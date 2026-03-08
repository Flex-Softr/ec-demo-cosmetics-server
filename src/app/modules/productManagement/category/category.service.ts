import httpStatus from "http-status";
import { PipelineStage, Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import ProductModel from "../product/product.model";
import { TCategory } from "./category.interface";
import { CategoryModel } from "./category.model";

const createCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TCategory
) => {
  payload.createdBy = createdBy;

  const { parent } = payload;

  const category = parent ? await CategoryModel.findById(parent) : null;
  const level = category?.level != null ? category.level + 1 : 0;

  const result = await CategoryModel.create({
    ...payload,
    level,
  });

  return result;
};

const getAllCategoriesFromDB = async (query?: Record<string, unknown>) => {
  /* ------------------ MATCH QUERY ------------------ */
  const matchQuery: Record<string, unknown> = {
    parent: null,
    isDeleted: false,
  };

  if (query?.isActive !== undefined) {
    matchQuery.isActive = query.isActive === "true";
  }

  /* ------------------ AGGREGATION ------------------ */
  const pipeline: PipelineStage[] = [
    // 1️⃣ Root categories
    {
      $match: matchQuery,
    },

    // 2️⃣ Image lookup
    {
      $lookup: {
        from: "images",
        localField: "image",
        foreignField: "_id",
        as: "image",
      },
    },
    {
      $unwind: {
        path: "$image",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 3️⃣ Recursive children (all levels)
    {
      $graphLookup: {
        from: "categories",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parent",
        as: "descendants",
        restrictSearchWithMatch: {
          isDeleted: false,
          ...(query?.isActive !== undefined && {
            isActive: query.isActive === "true",
          }),
        },
        depthField: "depth",
      },
    },

    // 4️⃣ Final projection
    {
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        level: 1,
        description: 1,
        isActive: 1,
        createdAt: 1,
        image: {
          _id: "$image._id",
          src: {
            $cond: [
              { $ifNull: ["$image.src", false] },
              { $concat: [config.image_base_url, "/", "$image.src"] },
              null,
            ],
          },
          alt: "$image.alt",
        },
        descendants: {
          _id: 1,
          name: 1,
          slug: 1,
          parent: 1,
          level: 1,
          description: 1,
          depth: 1,
          isActive: 1,
        },
      },
    },
  ];

  /* ------------------ QUERY HELPER ------------------ */
  const categoryQuery = new AggregateQueryHelper(
    CategoryModel.aggregate(pipeline),
    query || {}
  )
    .search(["name"])
    .sort()
    .paginate();

  const result = await categoryQuery.model;
  const total =
    (await CategoryModel.aggregate([
      { $match: matchQuery },
      { $count: "total" },
    ]))![0]?.total || 0;
  const meta = categoryQuery.metaData(total);

  /* ------------------ PRODUCT COUNTS ------------------ */
  const productCategoryData = await ProductModel.aggregate([
    { $match: { isDeleted: false } },
    { $unwind: "$category" },
    { $group: { _id: "$category", productIds: { $addToSet: "$_id" } } },
  ]);

  const categoryProductMap = new Map<string, Set<string>>();
  productCategoryData.forEach((item) => {
    categoryProductMap.set(
      item._id.toString(),
      new Set(item.productIds.map((id: Types.ObjectId) => id.toString()))
    );
  });

  /* ------------------ TREE BUILDER ------------------ */
  const buildTree = (
    nodes: TCategory[],
    parentId: Types.ObjectId | undefined
  ): { categories: TCategory[]; allProductIds: Set<string> } => {
    const currentLevelProductIds = new Set<string>();
    const tree = nodes
      .filter((node) => String(node?.parent ?? null) === String(parentId))
      .map((node) => {
        const { categories: subcategories } = buildTree(nodes, node._id);

        const nodeDirectProductIds =
          (node?._id && categoryProductMap.get(node._id.toString())) ||
          new Set();

        // Use only direct products for the count
        const productCount = nodeDirectProductIds.size;

        // Collect direct product IDs for the current level (if needed for other logic, duplicate checks etc,
        // though strictly for independent count we don't need subProducts).
        // If we strictly follow "independent", we don't need to bubble up subProductIds.
        // But let's keeping bubbling direct IDs just in case, but NOT mixing subProducts if we don't want them to count.
        // Wait, if I stop mixing subProducts, then subProductIds (from recursion) will only contain direct products of children.
        // If I don't add them to 'currentLevelProductIds', then they are lost to the parent.
        // The prompt says "will not be count children product count under parent".
        // So the parent should NOT know about children's products.

        nodeDirectProductIds.forEach((id) => currentLevelProductIds.add(id));

        return {
          ...node,
          productCount,
          subcategories,
        };
      });

    return { categories: tree, allProductIds: currentLevelProductIds };
  };

  /* ------------------ FINAL TREE ------------------ */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryTree = result.map((cat: any) => {
    const { categories: subcategories } = buildTree(
      cat.descendants || [],
      cat._id
    );

    const nodeDirectProductIds =
      (cat._id && categoryProductMap.get(cat._id.toString())) || new Set();

    // Independent count for root
    const productCount = nodeDirectProductIds.size;

    return {
      ...cat,
      productCount,
      subcategories,
      descendants: undefined,
    };
  });

  return { data: categoryTree, meta };
};

const getSingleCategoryFromDB = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid category id");
  }

  const category = await CategoryModel.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(id),
        isDeleted: false,
      },
    },
    // 3️⃣ Get direct subcategories
    {
      $lookup: {
        from: "categories",
        let: { parentId: "$_id" },
        pipeline: [
          {
            $match: {
              isDeleted: false,
              $expr: {
                $eq: ["$parent", "$$parentId"],
              },
            },
          },
          {
            $lookup: {
              from: "images",
              localField: "image",
              foreignField: "_id",
              as: "image",
            },
          },
          {
            $unwind: {
              path: "$image",
              preserveNullAndEmptyArrays: true,
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $project: {
              _id: 1,
              name: 1,
              slug: 1,
              image: {
                _id: "$image._id",
                src: {
                  $cond: [
                    { $ifNull: ["$image.src", false] },
                    { $concat: [config.image_base_url, "/", "$image.src"] },
                    null,
                  ],
                },
                alt: "$image.alt",
              },
              description: 1,
              level: 1,
              isActive: 1,
              createdAt: 1,
            },
          },
        ],
        as: "subcategories",
      },
    },

    // 4️⃣ Final shape
    {
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        level: 1,
        isActive: 1,
        createdAt: 1,
        subcategories: 1,
      },
    },
  ]);

  return category[0] || null;
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
  getSingleCategoryFromDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};
