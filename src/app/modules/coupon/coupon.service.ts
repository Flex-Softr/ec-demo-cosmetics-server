import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import ApiError from "../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../helper/query.helper";
import { TOptionalAuthGuardPayload } from "../../types/common";
import optionalAuthUserQuery from "../../types/optionalAuthUserQuery";
import { TJwtPayload } from "../authManagement/auth/auth.interface";
import { OrderHelper } from "../orderManagement/order/order.helper";
import {
  TOrderedProduct,
  TSanitizedOrProduct,
} from "../orderManagement/order/order.interface";
import { TCouponData } from "./coupon.interface";
import { Coupon } from "./coupon.model";

const createCouponIntoDB = async (payload: TCouponData, user: TJwtPayload) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const isAlreadyExist = await Coupon.findOne({ code: payload.code }).session(
      session
    );
    if (isAlreadyExist)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `An coupon already exist with this code - ${payload.code}`
      );

    const today = new Date(Date.now());

    if (payload.startDate) {
      const startDate = new Date(payload.startDate);
      if (isNaN(startDate.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid start date input");
      }

      if (today > startDate)
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "The selected start date must be a future date."
        );
    } else {
      payload.startDate = new Date(Date.now());
    }

    const endDate = new Date(payload.endDate);

    if (isNaN(endDate.getTime())) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid end date input");
    }
    if (today > endDate)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "The selected end date must be a future date."
      );

    // priorities the products
    if (
      payload?.fixedCategories?.length &&
      payload?.fixedProducts?.length &&
      payload?.restrictedCategories?.length
    ) {
      payload.fixedCategories = undefined;
      payload.restrictedCategories = undefined;
    } else if (
      !payload?.fixedProducts?.length &&
      payload?.fixedCategories?.length &&
      payload?.restrictedCategories?.length
    ) {
      // keep the restricted condition
      payload.fixedCategories = undefined;
    }

    payload.slug = payload.name.toLocaleLowerCase().split(" ").join("-");
    payload.createdBy = user.id;
    await Coupon.create([payload], { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllCouponsFromBD = async (query: Record<string, unknown>) => {
  if (!query.sort) query.sort = "-createdAt";

  const matchQuery: Record<string, unknown> = {};

  if (query.tags) {
    query.tags = Array.isArray(query.tags) ? query.tags : [query.tags];
    matchQuery.tags = { $in: query.tags };
  }

  if (query.search) {
    const searchRegex = new RegExp(
      Array.isArray(query.search) ? query.search[0] : query.search,
      "i"
    );

    matchQuery.$or = [{ name: { $regex: searchRegex } }];
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        isDeleted: false,
        ...matchQuery,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "allowedUsers",
        foreignField: "_id",
        as: "allowedUsers",
      },
    },
    {
      $unwind: {
        path: "$allowedUsers",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "allowedUsers.customer",
        foreignField: "_id",
        as: "customers",
      },
    },
    {
      $unwind: {
        path: "$customers",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "fixedCategories",
        foreignField: "_id",
        as: "fixedCategories",
      },
    },
    {
      $unwind: {
        path: "$fixedCategories",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "restrictedCategories",
        foreignField: "_id",
        as: "restrictedCategories",
      },
    },
    {
      $unwind: {
        path: "$restrictedCategories",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "fixedProducts",
        foreignField: "_id",
        as: "fixedProducts",
      },
    },
    {
      $unwind: {
        path: "$fixedProducts",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        slug: { $first: "$slug" },
        shortDescription: { $first: "$shortDescription" },
        code: { $first: "$code" },
        discountType: { $first: "$discountType" },
        discountValue: { $first: "$discountValue" },
        maxDiscount: { $first: "$maxDiscount" },
        minimumOrderValue: { $first: "$minimumOrderValue" },
        startDate: { $first: "$startDate" },
        usageLimit: { $first: "$usageLimit" },
        usageCount: { $first: "$usageCount" },
        onlyForRegisteredUsers: { $first: "$onlyForRegisteredUsers" },
        allowedUsers: {
          $push: {
            _id: "$allowedUsers._id",
            name: "$customers.fullName",
            phoneNumber: "$allowedUsers.phoneNumber",
          },
        },
        fixedCategories: {
          $push: {
            _id: "$fixedCategories._id",
            name: "$fixedCategories.name",
          },
        },
        restrictedCategories: {
          $push: {
            _id: "$restrictedCategories._id",
            name: "$restrictedCategories.name",
          },
        },
        fixedProducts: {
          $push: {
            _id: "$fixedProducts._id",
            title: "$fixedProducts.title",
          },
        },
        endDate: { $first: "$endDate" },
        tags: { $first: "$tags" },
        isActive: { $first: "$isActive" },
        isDeleted: { $first: "$isDeleted" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        shortDescription: 1,
        code: 1,
        discountType: 1,
        discountValue: 1,
        maxDiscount: 1,
        minimumOrderValue: 1,
        startDate: 1,
        usageLimit: 1,
        usageCount: 1,
        onlyForRegisteredUsers: 1,
        allowedUsers: {
          $filter: {
            input: "$allowedUsers",
            as: "au",
            cond: { $ne: ["$$au", {}] },
          },
        },
        fixedCategories: {
          $filter: {
            input: "$fixedCategories",
            as: "fCat",
            cond: { $ne: ["$$fCat", {}] },
          },
        },
        restrictedCategories: {
          $filter: {
            input: "$restrictedCategories",
            as: "rCat",
            cond: { $ne: ["$$rCat", {}] },
          },
        },
        fixedProducts: {
          $filter: {
            input: "$fixedProducts",
            as: "product",
            cond: { $ne: ["$$product", {}] },
          },
        },
        endDate: 1,
        tags: 1,
        isActive: 1,
        isDeleted: 1,
        createdAt: 1,
      },
    },
    {
      $addFields: {
        allowedUsers: {
          $cond: {
            if: { $eq: ["$allowedUsers", []] },
            then: undefined,
            else: "$allowedUsers",
          },
        },
        fixedProducts: {
          $cond: {
            if: { $eq: ["$fixedProducts", []] },
            then: undefined,
            else: "$fixedProducts",
          },
        },
        fixedCategories: {
          $cond: {
            if: { $eq: ["$fixedCategories", []] },
            then: undefined,
            else: "$fixedCategories",
          },
        },
        restrictedCategories: {
          $cond: {
            if: { $eq: ["$restrictedCategories", []] },
            then: undefined,
            else: "$restrictedCategories",
          },
        },
      },
    },
  ];

  const couponQuery = new AggregateQueryHelper(
    Coupon.aggregate(pipeline),
    query
  )
    .sort()
    .paginate();

  const total =
    (await Coupon.aggregate([
      {
        $match: {
          isDeleted: false,
          ...matchQuery,
        },
      },
      {
        $count: "total",
      },
    ]))![0]?.total || 0;
  const meta = couponQuery.metaData(total);

  const data = await couponQuery.model;

  return { data, meta };
};

const getSingleCouponFromBD = async (couponCode: string) => {
  const today = new Date(Date.now());
  const result = await Coupon.findOne(
    {
      code: couponCode,
      isActive: true,
      isDeleted: false,
      endDate: { $gt: today },
    },
    {
      name: 1,
      slug: 1,
      shortDescription: 1,
      code: 1,
      percentage: 1,
      endDate: 1,
      maxDiscountAmount: 1,
      limitDiscountAmount: 1,
      isActive: 1,
      createdAt: 1,
    }
  );
  if (!result) throw new ApiError(httpStatus.BAD_REQUEST, "No coupon found");
  return result;
};

const updateCouponCodeIntoDB = async (id: string, payload: TCouponData) => {
  const isExist = await Coupon.findOne({
    _id: new Types.ObjectId(id),
    isDeleted: false,
  });

  if (!isExist)
    throw new ApiError(httpStatus.BAD_REQUEST, "No coupon data found");

  payload.usageCount = undefined;

  if (payload.endDate) {
    const endDate = new Date(payload.endDate);
    if (isNaN(endDate.getTime())) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid coupon end date input"
      );
    }
    payload.endDate = endDate;
  }

  if (payload.startDate) {
    const startDate = new Date(payload.startDate);
    if (isNaN(startDate.getTime())) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid coupon end date input"
      );
    }
    payload.startDate = startDate;
  }

  await Coupon.updateOne(
    {
      _id: new Types.ObjectId(id),
      isDeleted: false,
    },
    {
      $set: payload,
    }
  );
};

const calculateCouponDiscount = async (
  body: {
    shippingCharge: mongoose.Types.ObjectId;
    salesPage: boolean;
    orderedProducts: TOrderedProduct[];
    coupon?: string;
  },
  user: TOptionalAuthGuardPayload
) => {
  const userQuery = optionalAuthUserQuery(user);

  userQuery.userId = userQuery.userId
    ? new Types.ObjectId(userQuery.userId)
    : undefined;
  const { shippingCharge, orderedProducts, salesPage, coupon } = body;

  if (!coupon)
    throw new ApiError(httpStatus.BAD_REQUEST, "Please add a coupon.");

  let orderedProductInfo: TSanitizedOrProduct[] = [];
  if (salesPage) {
    orderedProductInfo =
      await OrderHelper.sanitizeOrderedProducts(orderedProducts);
  } else {
    const cart = await OrderHelper.sanitizeCartsForOrder(userQuery);
    orderedProductInfo = cart;
  }
  const { cost } =
    OrderHelper.validateAndSanitizeOrderedProducts(orderedProductInfo);

  const { couponDiscount, shippingChange } =
    await OrderHelper.orderCostAfterCoupon(
      cost,
      shippingCharge.toString(),
      orderedProductInfo,
      { couponCode: coupon, user }
    );

  return { couponDiscount, shippingChange, cost };
};

const getAllTagsFromDB = async () => {
  const tags = (
    await Coupon.aggregate([
      {
        $unwind: "$tags",
      },
      {
        $group: {
          _id: null,
          tags: { $addToSet: "$tags" },
        },
      },
      {
        $project: {
          _id: 0,
          tags: 1,
        },
      },
    ])
  )[0];

  return tags;
};

export const CouponServices = {
  createCouponIntoDB,
  getAllCouponsFromBD,
  getSingleCouponFromBD,
  updateCouponCodeIntoDB,
  calculateCouponDiscount,
  getAllTagsFromDB,
};
