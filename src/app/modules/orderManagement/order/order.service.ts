import { Request } from "express";
import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import { TSchedulePickRequestBody } from "../../../types/schedulePickup";
import { getPaperflyStatusByReference } from "../../../utilities/couriers/paperfly";
import { getPathaoStatusByConsignmentId } from "../../../utilities/couriers/pathao";
import { schedulePickup } from "../../../utilities/couriers/schedulePickup";
import { getSteadfastStatusByInvoice } from "../../../utilities/couriers/steadfast";
import { schedulePickOnSteadfastBulk } from "../../../utilities/couriers/steadfastBulk";
import formatShippingAddress from "../../../utilities/formatShippingAddress";
import { convertIso } from "../../../utilities/ISOConverter";
import triggerCancelEvent from "../../../utilities/triggerCancelEvent";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TCourier } from "../../courier/courier.interface";
import { Courier } from "../../courier/courier.model";
import { PaymentMethod } from "../../paymentMethod/paymentMethod.model";
import { TInventory } from "../../productManagement/inventory/inventory.interface";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import { calculateStockStatus } from "../../productManagement/inventory/inventory.utils";
import { TPrice } from "../../productManagement/price/price.interface";
import ProductModel from "../../productManagement/product/product.model";
import { TVariation } from "../../productManagement/variation/variation.interface";
import VariationModel from "../../productManagement/variation/variation.model";
import { User } from "../../userManagement/user/user.model";
import { Warranty } from "../../warrantyManagement/warranty/warranty.model";
import { OrderPayment } from "../orderPayment/orderPayment.model";
import { TOrderStatusHistoryData } from "../orderStatusHistory/orderStatusHistory.interface";
import { OrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.model";
import { TShipping, TShippingData } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { TShippingCharge } from "../shippingCharge/shippingCharge.interface";
import { ShippingCharge } from "../shippingCharge/shippingCharge.model";
import { orderStatus, orderStatusWithDesc } from "./order.const";
import { OrderHelper } from "./order.helper";
import {
  TOrder,
  TOrderedProduct,
  TOrderStatus,
  TOrderStatusWithDesc,
  TSMSReceiverInfo,
} from "./order.interface";
import { Order } from "./order.model";
import {
  createNewOrder,
  deleteWarrantyFromOrder,
  TOrderDataForCourier,
  TUpStOnCanDelProducts,
  updateStockOrderCancelDelete,
} from "./order.utils";
import { TSchedulePickup } from "./order.validate";

const maxOrderStatusChangeAtATime = 20;

/* -----------------------------------------
          Create order
----------------------------------------- */
const createOrder = async (req: Request) => {
  let response;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    response = await createNewOrder(
      req as unknown as Record<string, unknown>,
      session,
      { warrantyClaim: false }
    );
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
  return response;
};

/* -----------------------------------------
          Get pending orders
----------------------------------------- */
const getAllOrdersForAdmin = async (query: Record<string, string>) => {
  const matchQuery: Record<string, unknown> = {};
  const acceptableStatus: TOrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "follow up",
  ];
  if (query.search || query.userId) {
    acceptableStatus.push(
      "warranty processing",
      "processing done",
      "warranty added",
      "on courier",
      "canceled",
      "returned",
      "partial completed",
      "completed",
      "deleted"
    );
  }
  if (
    ![...acceptableStatus, "canceled", "deleted", "all", undefined].includes(
      query.status as never
    )
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't get ${query.status} orders`
    );
  }

  if (query.userId) {
    matchQuery.userId = new Types.ObjectId(query.userId);
  }

  if (query.status) {
    matchQuery.status = query?.status as string;
  }

  // if there is no status or status is all and no search query provided
  if ((!query.status || query.status === "all") && !query.search) {
    matchQuery.status = {
      $in: acceptableStatus,
    };
  }

  if (query.startFrom) {
    const startTime = convertIso(query.startFrom);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $gte: startTime,
    };
  }

  if (query.endAt) {
    const endTime = convertIso(query.endAt, false);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $lte: endTime,
    };
  }

  const pipeline = OrderHelper.orderDetailsPipeline();
  pipeline.unshift({
    $match: matchQuery,
  });

  if (query.search) {
    const searchRegex = new RegExp(query.search, "i"); // 'i' for case-insensitive matching
    pipeline.push({
      $match: {
        $or: [
          { "shipping.phoneNumber": { $regex: searchRegex } },
          { "shipping.fullName": { $regex: searchRegex } },
          { orderId: { $regex: searchRegex } },
        ],
      },
    });
  }
  const orderQuery = new AggregateQueryHelper(Order.aggregate(pipeline), query)
    .sort()
    .paginate();

  const data = await orderQuery.model;
  const total =
    (await Order.aggregate([{ $match: matchQuery }, { $count: "total" }]))![0]
      ?.total || 0;
  const meta = orderQuery.metaData(total);

  // get counts
  const statusMap = {
    all: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    "follow up": 0,
    canceled: 0,
    deleted: 0,
  };
  const statusPipeline = [
    {
      $match: {
        status: {
          $in: Object.keys(statusMap).filter((status) => status !== "all"),
        },
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ];

  const result = await Order.aggregate(statusPipeline);

  result.forEach(({ _id, total }) => {
    statusMap[_id as keyof typeof statusMap] = total;
    if (!["canceled", "deleted"].includes(_id)) {
      statusMap.all += total;
    }
  });

  const formattedResult = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));

  return { countsByStatus: formattedResult, meta, data };
};

/* -----------------------------------------
          Get processing orders
----------------------------------------- */
const getProcessingOrders = async (query: Record<string, string>) => {
  const matchQuery: Record<string, unknown> = {};
  const acceptableStatus: TOrderStatus[] = [
    "processing",
    "warranty processing",
    "warranty added",
    "processing done",
  ];

  if (query.search) {
    acceptableStatus.push(
      "pending",
      "confirmed",
      "follow up",
      "on courier",
      "canceled",
      "returned",
      "partial completed",
      "completed",
      "deleted"
    );
  }

  if (query.status) {
    matchQuery.status = query?.status as string;
  }

  if ((!query.status || query.status === "all") && !query.search) {
    matchQuery.status = {
      $in: acceptableStatus,
    };
  }

  if (query.startFrom) {
    const startTime = convertIso(query.startFrom);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $gte: startTime,
    };
  }

  if (query.endAt) {
    const endTime = convertIso(query.endAt, false);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $lte: endTime,
    };
  }

  if (![...acceptableStatus, undefined].includes(query.status as never)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't get ${query.status} orders`
    );
  }

  const pipeline = OrderHelper.orderDetailsPipeline();

  pipeline.unshift({
    $match: matchQuery,
  });

  if (query.search) {
    const searchRegex = new RegExp(query.search, "i"); // 'i' for case-insensitive matching
    pipeline.push({
      $match: {
        $or: [
          { "shipping.phoneNumber": { $regex: searchRegex } },
          { "shipping.fullName": { $regex: searchRegex } },
          { orderId: { $regex: searchRegex } },
        ],
      },
    });
  }

  const orderQuery = new AggregateQueryHelper(Order.aggregate(pipeline), query)
    .sort()
    .paginate();

  const data = await orderQuery.model;

  const total =
    (await Order.aggregate([{ $match: matchQuery }, { $count: "total" }]))![0]
      ?.total || 0;
  const meta = orderQuery.metaData(total);

  // Orders counts
  const statusMap = {
    processing: 0,
    "warranty processing": 0,
    "warranty added": 0,
    "processing done": 0,
  };
  const countRes = await Order.aggregate([
    {
      $match: {
        status: {
          $in: Object.keys(statusMap),
        },
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ]);
  countRes.forEach(({ _id, total }) => {
    statusMap[_id as keyof typeof statusMap] = total;
  });
  const formattedCount = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));

  return { countsByStatus: formattedCount, meta, data };
};

/* -----------------------------------------
  Get processing done and on courier orders
----------------------------------------- */
const getCourierShipmentOrders = async (query: Record<string, string>) => {
  const matchQuery: Record<string, unknown> = {};
  const acceptableStatus: TOrderStatus[] = ["processing done", "on courier"];

  if (query.search) {
    acceptableStatus.push(
      "pending",
      "confirmed",
      "processing",
      "warranty processing",
      "follow up",
      "warranty added",
      "canceled",
      "returned",
      "partial completed",
      "completed",
      "deleted"
    );
  }

  if (query.status) {
    matchQuery.status = query?.status as string;
  }

  if ((!query.status || query.status === "all") && !query.search) {
    matchQuery.status = {
      $in: acceptableStatus,
    };
  }

  if (query.startFrom) {
    const startTime = convertIso(query.startFrom);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $gte: startTime,
    };
  }

  if (query.endAt) {
    const endTime = convertIso(query.endAt, false);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $lte: endTime,
    };
  }

  if (![...acceptableStatus, undefined].includes(query.status as never)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't get ${query.status} orders`
    );
  }

  const pipeline = OrderHelper.orderDetailsPipeline();

  pipeline.unshift({
    $match: matchQuery,
  });

  if (query.search) {
    const searchRegex = new RegExp(query.search, "i"); // 'i' for case-insensitive matching
    pipeline.push({
      $match: {
        $or: [
          { "shipping.phoneNumber": { $regex: searchRegex } },
          { "shipping.fullName": { $regex: searchRegex } },
          { orderId: { $regex: searchRegex } },
        ],
      },
    });
  }

  const orderQuery = new AggregateQueryHelper(Order.aggregate(pipeline), query)
    .sort()
    .paginate();

  const data = await orderQuery.model;
  const total =
    (await Order.aggregate([{ $match: matchQuery }, { $count: "total" }]))![0]
      ?.total || 0;
  const meta = orderQuery.metaData(total);

  // Orders counts
  const statusMap = {
    "processing done": 0,
    "on courier": 0,
  };
  const countRes = await Order.aggregate([
    {
      $match: {
        status: {
          $in: Object.keys(statusMap),
        },
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ]);
  countRes.forEach(({ _id, total }) => {
    statusMap[_id as keyof typeof statusMap] = total;
  });
  const formattedCount = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));

  return { countsByStatus: formattedCount, meta, data };
};

/* -----------------------------------------
        Get monitoring orders
----------------------------------------- */
const getMonitorDeliveryOrders = async (query: Record<string, string>) => {
  const matchQuery: Record<string, unknown> = {};
  if (query.deliveryStatus) {
    matchQuery.deliveryStatus = query?.deliveryStatus as string;
  }

  if (query.courierId) {
    matchQuery["courierDetails.courierProvider"] = new mongoose.Types.ObjectId(
      query.courierId
    );
  }

  if (query.startFrom) {
    const startTime = convertIso(query.startFrom);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $gte: startTime,
    };
  }

  if (query.endAt) {
    const endTime = convertIso(query.endAt, false);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $lte: endTime,
    };
  }

  const pipeline = OrderHelper.orderDetailsPipeline();

  pipeline.unshift({
    $match: { status: "on courier", ...matchQuery },
  });

  if (query.search) {
    const searchRegex = new RegExp(query.search, "i"); // 'i' for case-insensitive matching
    pipeline.push({
      $match: {
        $or: [
          { "shipping.phoneNumber": { $regex: searchRegex } },
          { "shipping.fullName": { $regex: searchRegex } },
          { orderId: { $regex: searchRegex } },
        ],
      },
    });
  }

  const orderQuery = new AggregateQueryHelper(Order.aggregate(pipeline), query)
    .sort()
    .paginate();

  const data = await orderQuery.model;
  const total =
    (await Order.aggregate([
      { $match: { status: "on courier", ...matchQuery } },
      { $count: "total" },
    ]))![0]?.total || 0;
  const meta = orderQuery.metaData(total);

  // generate dynamically by delivery status value
  const countRes = await Order.aggregate([
    {
      $match: {
        deliveryStatus: { $exists: true, $ne: null },
        status: "on courier",
        ...matchQuery,
      },
    },
    {
      $group: {
        _id: "$deliveryStatus",
        total: { $sum: 1 },
      },
    },
  ]);

  const statusMap: Record<string, number> = {
    all: 0,
  };

  countRes.forEach(({ _id, total }) => {
    if (_id) statusMap[_id] = total;
    statusMap.all += total;
  });

  const formattedCount = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));

  // Count by courier provider with name
  const courierCountRes = await Order.aggregate([
    {
      $match: {
        status: "on courier",
        "courierDetails.courierProvider": { $exists: true, $ne: null },
        ...(query.deliveryStatus
          ? { deliveryStatus: query.deliveryStatus }
          : {}),
      },
    },
    {
      $group: {
        _id: "$courierDetails.courierProvider",
        total: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "couriers",
        localField: "_id",
        foreignField: "_id",
        as: "courier",
      },
    },
    { $unwind: { path: "$courier", preserveNullAndEmptyArrays: false } },
    {
      $project: {
        _id: 1,
        name: "$courier.name",
        slug: "$courier.slug",
        total: 1,
      },
    },
  ]);

  return {
    countsByStatus: formattedCount,
    countsByCourier: courierCountRes,
    meta,
    data,
  };
};

/* -----------------------------------------
          Get completed orders
----------------------------------------- */
const getCompletedOrders = async (query: Record<string, string>) => {
  let queryProducts: string[] = [];
  const orderedTimes: string | undefined = query.orderedTimes;

  if (query.productIds) {
    queryProducts = (query.productIds as string)
      .split(",")
      .map((item) => item.trim());
  }

  const matchQuery: Record<string, unknown> = {};
  const acceptableStatus: TOrderStatus[] = [
    "completed",
    "partial completed",
    "returned",
    "canceled",
  ];

  if (query.search) {
    acceptableStatus.push(
      "pending",
      "confirmed",
      "follow up",
      "on courier",
      "canceled",
      "deleted",
      "processing",
      "processing done",
      "warranty added",
      "warranty processing"
    );
  }

  if (query.status) {
    matchQuery.status = query.status as string;
  }
  if (query.orderId) {
    matchQuery.orderId = query.orderId as string;
  }

  if ((!query.status || query.status === "all") && !query.search) {
    matchQuery.status = {
      $in: acceptableStatus,
    };
  }

  if (query.startFrom) {
    const startTime = convertIso(query.startFrom);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt as Record<string, unknown> | undefined),
      $gte: startTime,
    };
  }

  if (query.endAt) {
    const endTime = convertIso(query.endAt, false);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt as Record<string, unknown> | undefined),
      $lte: endTime,
    };
  }

  if (![...acceptableStatus, undefined].includes(query.status as never)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't get ${query.status} orders`
    );
  }

  if (queryProducts.length > 0) {
    matchQuery.orderedProducts = {
      $elemMatch: {
        product: {
          $in: queryProducts.map((item) => new Types.ObjectId(item)),
        },
      },
    };
  }

  if (query.orderSource) {
    matchQuery["orderSource.name"] = query.orderSource;
  }

  // Resolve shipping filters / search BEFORE the heavy details pipeline
  const shippingFilter: Record<string, unknown> = {};
  if (query.division) shippingFilter.division = query.division;
  if (query.district) shippingFilter.district = query.district;
  if (query.upazila) shippingFilter.upazila = query.upazila;

  if (query.search) {
    const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");

    const matchedShippings = await Shipping.find({
      ...shippingFilter,
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { fullName: { $regex: searchRegex } },
      ],
    })
      .select("_id")
      .lean();

    const shippingIds = matchedShippings.map((item) => item._id);
    matchQuery.$or = [
      { shipping: { $in: shippingIds } },
      { orderId: { $regex: searchRegex } },
    ];
  } else if (Object.keys(shippingFilter).length > 0) {
    const matchedShippings = await Shipping.find(shippingFilter)
      .select("_id")
      .lean();
    matchQuery.shipping = {
      $in: matchedShippings.map((item) => item._id),
    };
  }

  if (orderedTimes) {
    const groupedOrders = await Order.aggregate<{
      _id: string;
      orderIds: Types.ObjectId[];
      orderedTimes: number;
    }>([
      { $match: matchQuery },
      {
        $lookup: {
          from: "shippings",
          localField: "shipping",
          foreignField: "_id",
          as: "shippingData",
        },
      },
      {
        $unwind: {
          path: "$shippingData",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$shippingData.phoneNumber",
          orderIds: { $push: "$_id" },
          orderedTimes: { $sum: 1 },
        },
      },
      {
        $match: {
          orderedTimes: { $eq: Number(orderedTimes) },
        },
      },
    ]);

    const matchedOrderIds = groupedOrders.flatMap((group) => group.orderIds);
    matchQuery._id = { $in: matchedOrderIds };
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 12;
  const skip = (page - 1) * limit;
  const sortField = query.sort
    ? query.sort.startsWith("-")
      ? query.sort.slice(1)
      : query.sort
    : "createdAt";
  const sortDir = query.sort?.startsWith("-") || !query.sort ? -1 : 1;

  // 1) Select only the current page of order IDs (phone-deduped) — no heavy lookups
  const selectionResult = await Order.aggregate<{
    data: { orderObjectId: Types.ObjectId }[];
    total: { total: number }[];
  }>([
    { $match: matchQuery },
    { $sort: { [sortField]: sortDir } as Record<string, 1 | -1> },
    {
      $lookup: {
        from: "shippings",
        localField: "shipping",
        foreignField: "_id",
        as: "shippingData",
      },
    },
    {
      $unwind: {
        path: "$shippingData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$shippingData.phoneNumber",
        orderObjectId: { $first: "$_id" },
        createdAt: { $first: "$createdAt" },
      },
    },
    { $sort: { createdAt: sortDir } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          { $project: { _id: 0, orderObjectId: 1 } },
        ],
        total: [{ $count: "total" }],
      },
    },
  ]).allowDiskUse(true);

  const pageOrderIds =
    selectionResult[0]?.data.map((item) => item.orderObjectId) ?? [];
  const total = selectionResult[0]?.total[0]?.total ?? 0;

  // 2) Load full order details ONLY for the current page
  let data: unknown[] = [];
  if (pageOrderIds.length > 0) {
    const detailsPipeline = OrderHelper.orderDetailsPipeline();
    detailsPipeline.unshift({
      $match: { _id: { $in: pageOrderIds } },
    });
    detailsPipeline.push(
      {
        $addFields: {
          __order: { $indexOfArray: [pageOrderIds, "$_id"] },
        },
      },
      { $sort: { __order: 1 } },
      { $project: { __order: 0 } }
    );
    data = await Order.aggregate(detailsPipeline);
  }

  const meta = {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit) || 1,
  };

  // Status badge counts — lightweight indexed group
  const statusMap = {
    completed: 0,
    "partial completed": 0,
    returned: 0,
    canceled: 0,
  };
  const countRes = await Order.aggregate<{ _id: string; total: number }>([
    {
      $match: {
        status: {
          $in: Object.keys(statusMap),
        },
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ]);
  countRes.forEach(({ _id, total: statusTotal }) => {
    statusMap[_id as keyof typeof statusMap] = statusTotal;
  });
  const formattedCount = Object.entries(statusMap).map(
    ([name, totalCount]) => ({
      name,
      total: totalCount,
    })
  );

  return { countsByStatus: formattedCount, meta, data };
};

/* -----------------------------------------
          Get single orders data
----------------------------------------- */
const getOrderDetailsForAdmin = async (
  id: mongoose.Types.ObjectId
): Promise<TOrder | null> => {
  const pipeline: PipelineStage[] = OrderHelper.orderDetailsPipeline();
  pipeline.unshift({ $match: { _id: new mongoose.Types.ObjectId(id) } });

  const result = (await Order.aggregate(pipeline))[0];

  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No order found with this id");
  }

  return result;
};

/* -----------------------------------------
      Get all orders for customers
----------------------------------------- */
const getAllOrdersForCustomer = async (user: TOptionalAuthGuardPayload) => {
  const userQuery = optionalAuthUserQuery(user);

  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "shippings",
        localField: "shipping",
        foreignField: "_id",
        as: "shippingData",
      },
    },
    {
      $unwind: { path: "$shippingData", preserveNullAndEmptyArrays: true },
    },
  ];

  const orQueries: Record<string, unknown>[] = [];

  if (userQuery.userId) {
    const userId = new Types.ObjectId(userQuery.userId);
    orQueries.push({ userId });

    // Find user's phone number from DB if it's not in the query
    if (!userQuery.phoneNumber) {
      const userData = await User.findById(userId).select("phoneNumber");
      if (userData?.phoneNumber) {
        userQuery.phoneNumber = userData.phoneNumber;
      }
    }
  }

  if (userQuery.phoneNumber) {
    orQueries.push({ "shippingData.phoneNumber": userQuery.phoneNumber });
  }

  if (userQuery.sessionId) {
    orQueries.push({ sessionId: userQuery.sessionId });
  }

  const matchQuery: Record<string, unknown> = {
    isDeleted: false,
  };

  if (orQueries.length > 0) {
    matchQuery.$or = orQueries;
  }

  pipeline.push({ $match: matchQuery });

  // Append the rest of the customer pipeline (excluding the shipping lookup and unwind stages)
  const customerPipeline = OrderHelper.orderDetailsCustomerPipeline();
  pipeline.push(...customerPipeline.slice(2));

  const result = await Order.aggregate(pipeline);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result.map((order: any) => {
    if (order.shipping) {
      order.shipping.fullAddress = formatShippingAddress(
        order.shipping,
        undefined,
        true
      );
    }
    return order;
  });
};

/* -----------------------------------------
    Get single order info for customers
-------------------------------------------- */
const getOrderDetailsForCustomer = async (id: string) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);

  const matchQuery: Record<string, unknown> = {};

  if (isObjectId) {
    matchQuery._id = new Types.ObjectId(id);
  } else {
    matchQuery.orderId = id;
  }

  const pipeline = [
    { $match: matchQuery },
    ...OrderHelper.orderDetailsCustomerPipeline(),
  ];
  const result = (await Order.aggregate(pipeline))[0];
  if (result && result.shipping) {
    result.shipping.fullAddress = formatShippingAddress(
      result.shipping,
      undefined,
      true
    );
  }

  return result;
};

/* -----------------------------------------
        Update order initial status
-------------------------------------------- */
const updateOrderStatus = async (
  user: TJwtPayload,
  payload: {
    status: TOrderStatus;
    orderIds: mongoose.Types.ObjectId[];
  }
): Promise<void> => {
  // From this api admin can only change this orders
  const changeableOrders: Partial<TOrderStatus[]> = [
    "pending",
    "confirmed",
    "follow up",
    "canceled",
  ];

  // From this API, admins can only change to this status below.
  const acceptableStatus: Partial<TOrderStatus[]> = [
    ...changeableOrders,
    "processing",
    "canceled",
    "deleted",
  ];

  if (![...acceptableStatus].includes(payload.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't change to ${payload.status}`
    );
  }

  if (payload?.orderIds?.length > maxOrderStatusChangeAtATime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't update more than ${maxOrderStatusChangeAtATime} orders at a time`
    );
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const pipeline: PipelineStage[] = OrderHelper.orderStatusUpdatingPipeline(
      payload.orderIds,
      changeableOrders
    );

    const orders = (await Order.aggregate(pipeline)) as Partial<TOrder[]>;

    const statusUpdateQuery: {
      updateOne: {
        filter: {
          _id: Types.ObjectId;
        };
        update: {
          status: TOrderStatus;
          isDeleted: boolean;
        };
      };
    }[] = [];

    const historyUpdateQuery: {
      updateOne: {
        filter: {
          _id: Types.ObjectId;
        };
        update: {
          $push: {
            history: {
              status: TOrderStatus;
              updatedBy: Types.ObjectId;
            };
          };
        };
      };
    }[] = [];

    orders?.forEach((order) => {
      if (order?.status !== payload.status) {
        const statusUpdateData = {
          updateOne: {
            filter: { _id: order?._id as Types.ObjectId },
            update: {
              status: payload.status,
              isDeleted: payload.status === "deleted",
            },
          },
        };
        statusUpdateQuery?.push(statusUpdateData);
        const historyUpdateData = {
          updateOne: {
            filter: { _id: order?.statusHistory as Types.ObjectId },
            update: {
              $push: {
                history: {
                  status: payload.status,
                  updatedBy: user.id,
                },
              },
            },
          },
        };
        historyUpdateQuery.push(historyUpdateData);
      }
    });

    if (statusUpdateQuery.length) {
      await Order.bulkWrite(statusUpdateQuery, { session });
    }

    if (historyUpdateQuery.length) {
      await OrderStatusHistory.bulkWrite(historyUpdateQuery, { session });
    }
    // Change the orders one by one
    for (const order of orders) {
      // If this order's previous status is not same as the current
      if (order?.status !== payload.status) {
        const orderPreviousStatus = order?.status;

        const orderedProducts =
          order?.orderedProducts as unknown as TUpStOnCanDelProducts[];
        // If the admin try to retrieve a canceled order
        if (
          orderPreviousStatus === "canceled" &&
          !["canceled", "deleted"].includes(payload.status)
        ) {
          await updateStockOrderCancelDelete(orderedProducts, session, false);
        }
        // if the previous status is not canceled or deleted and now try to cancel the order
        else if (
          !["canceled", "deleted"].includes(orderPreviousStatus || "") &&
          ["canceled", "deleted"].includes(payload.status)
        ) {
          triggerCancelEvent(order?.orderId || "");
          await updateStockOrderCancelDelete(orderedProducts, session);
        }
      }
    }

    if (
      (orders.length && payload.status === "canceled") ||
      payload.status === "confirmed"
    ) {
      const SMSReviverInformations: TSMSReceiverInfo[] = orders.map((order) => {
        const shipping = (order as unknown as { shippingData: TShipping })
          ?.shippingData;
        return {
          fullName: shipping?.fullName || "",
          phoneNumber: shipping?.phoneNumber || "",
          email: shipping?.email || "",
          orderId: order?.orderId || "",
          total: order?.total.toString() || "0",
        };
      });

      SMSReviverInformations.forEach(async (receiver) => {
        await OrderHelper.sendOrderSMSNotification(
          receiver,
          payload.status === "confirmed"
            ? "order_confirmed"
            : payload.status === "canceled"
              ? "order_canceled"
              : undefined
        );
      });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/* -----------------------------------------
          Update processing status
-------------------------------------------- */
const updateProcessingOrderStatus = async (
  orderIds: mongoose.Types.ObjectId[],
  status: Partial<TOrderStatus>,
  user: TJwtPayload
) => {
  const changeableStatus: Partial<TOrderStatus[]> = [
    "processing",
    "warranty added",
    "processing done",
    "warranty processing",
  ];
  const acceptableStatus = [
    "warranty added",
    "processing done",
    "canceled",
    "follow up",
  ];
  if (![...acceptableStatus].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Can't change to ${status}`);
  }

  if (orderIds.length > maxOrderStatusChangeAtATime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't update more than ${maxOrderStatusChangeAtATime} orders at a time`
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const pipeline = OrderHelper.orderStatusUpdatingPipeline(
      orderIds,
      changeableStatus
    );
    const orders = await Order.aggregate(pipeline).session(session);

    for (const order of orders) {
      if (status === "processing done") {
        for (const {
          warranty,
          productWarranty,
          title: productTitle,
        } of order.orderedProducts) {
          if (productWarranty && !warranty) {
            throw new ApiError(
              httpStatus.BAD_REQUEST,
              `Please add warranty to order '${order?.orderId}' product '${productTitle}'`
            );
          }
        }
      }

      // Update order status
      await Order.updateOne({ _id: order._id }, { status }, { session });
      // Update order status history
      await OrderStatusHistory.updateOne(
        { _id: order.statusHistory },
        {
          $push: {
            history: {
              status,
              updatedBy: user.id,
            },
          },
        },
        { session }
      );

      if (status === "canceled") {
        triggerCancelEvent(order?.orderId || "");
        await Promise.all([
          updateStockOrderCancelDelete(
            order.orderedProducts as unknown as TUpStOnCanDelProducts[],
            session
          ),
          deleteWarrantyFromOrder(
            order.orderedProducts as unknown as TOrderedProduct[],
            order._id,
            session
          ),
        ]);
      }
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

/* -----------------------------------------
    Update order details by admin
-------------------------------------------- */
const updateOrderDetails = async (
  id: mongoose.Types.ObjectId,
  payload: Record<string, unknown>
) => {
  const {
    discount,
    advance,
    shipping,
    invoiceNotes,
    officialNotes,
    courierNotes,
    followUpDate,
    monitoringNotes,
    reasonNotes,
    orderedProducts: updatedOrderedProducts,
    status,
    monitoringStatus,
    trackingStatus,
    payment,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = payload as any;

  const findOrder = await OrderHelper.findOrderForUpdatingOrder(id);

  if (!findOrder) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No order found with this ID.");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Update -- shipping
    if (Object.keys((shipping as TShipping) || {}).length) {
      await Shipping.findOneAndUpdate(
        { _id: findOrder.shipping },
        shipping
      ).session(session);
    }

    // Update -- payment
    if (payment) {
      if (payment.paymentMethod) {
        const paymentMethod = await PaymentMethod.findById(
          payment.paymentMethod
        ).session(session);
        if (!paymentMethod) {
          throw new ApiError(httpStatus.BAD_REQUEST, "No payment method found");
        }
      }
      const paymentSetOptions: Record<string, unknown> = {
        paymentMethod: payment.paymentMethod,
        paymentDetails: payment.paymentDetails || {},
      };
      const paymentUnsetOptions: Record<string, unknown> = {};

      if (payment.phoneNumber) {
        paymentSetOptions.phoneNumber = payment.phoneNumber;
      } else {
        paymentUnsetOptions.phoneNumber = 1;
      }

      if (payment.transactionId) {
        paymentSetOptions.transactionId = payment.transactionId;
      } else {
        paymentUnsetOptions.transactionId = 1;
      }

      await OrderPayment.findOneAndUpdate(
        { _id: findOrder.payment },
        {
          $set: paymentSetOptions,
          $unset: paymentUnsetOptions,
        }
      ).session(session);
    }

    const updatedDoc: Record<string, unknown> = {};
    let increments = 0;
    let decrements = 0;

    // Update -- product details and recalculate subtotal
    let newSubtotal = 0;
    let newWarrantyAmount = 0;
    if (
      updatedOrderedProducts ||
      (updatedOrderedProducts as unknown as TOrderedProduct[])?.length > 0
    ) {
      for (const updatedProduct of updatedOrderedProducts || []) {
        const existingProductIndex = updatedProduct.id
          ? findOrder.orderedProducts.findIndex(
              (p) => p?._id?.toString() === updatedProduct.id?.toString()
            )
          : -1;

        if (updatedProduct.id && existingProductIndex !== -1) {
          if (updatedProduct.isDelete) {
            const removedProduct = findOrder.orderedProducts.splice(
              existingProductIndex,
              1
            );

            if (findOrder.deliveryStatus == "partial_delivered") {
              updatedDoc.deliveryStatus = "partial completed";
            }
            if (removedProduct.length > 0) {
              // Extract all warranty IDs that exist (filter out undefined/null)
              const warrantyIds = removedProduct
                .map((product) => product.warranty)
                .filter((warranty) => warranty); // Remove undefined/null values

              if (warrantyIds.length > 0) {
                // Delete all warranties that match the extracted IDs
                await Warranty.deleteMany({
                  _id: { $in: warrantyIds },
                }).session(session);
              }

              // Restore stock for each removed product
              for (const removed of removedProduct) {
                const qty = removed.quantity || 0;
                if (qty <= 0) continue;

                const varInv = removed?.inventoryInfo?.variationInventory;
                const defInv = removed?.inventoryInfo?.defaultInventory;

                if (varInv?.manageStock && varInv._id) {
                  // Variable product: restore stock on the variation's inventory
                  const restoredQty = Number(varInv.stockAvailable || 0) + qty;
                  const newStatus = calculateStockStatus(
                    restoredQty,
                    varInv.lowStockWarning || 0
                  );
                  await InventoryModel.updateOne(
                    { _id: varInv._id },
                    {
                      $set: {
                        stockAvailable: restoredQty,
                        stockStatus: newStatus,
                      },
                    },
                    { session }
                  );
                } else if (defInv?.manageStock && defInv._id) {
                  // Simple product: restore stock on the default inventory
                  const restoredQty = Number(defInv.stockAvailable || 0) + qty;
                  const newStatus = calculateStockStatus(
                    restoredQty,
                    defInv.lowStockWarning || 0
                  );
                  await InventoryModel.updateOne(
                    { _id: defInv._id },
                    {
                      $set: {
                        stockAvailable: restoredQty,
                        stockStatus: newStatus,
                      },
                    },
                    { session }
                  );
                }
              }
            }
          } else {
            // Update existing product details
            const currentProduct =
              findOrder.orderedProducts[existingProductIndex];
            const previousQuantity = currentProduct?.quantity;

            if (updatedProduct.quantity || updatedProduct.quantity === 0) {
              currentProduct.total =
                currentProduct.unitPrice * updatedProduct.quantity;
              currentProduct.quantity = updatedProduct.quantity;

              if (currentProduct?.warranty) {
                if (
                  (updatedProduct?.warrantyCodes?.length || 0) !==
                  currentProduct?.quantity
                ) {
                  throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `Product '${currentProduct?.productTitle}' quantity is ${currentProduct?.quantity} but got ${updatedProduct?.warrantyCodes?.length || 0} warranty codes. Please update warranty codes`
                  );
                }

                const seen = new Set();
                for (const item of updatedProduct?.warrantyCodes || []) {
                  if (seen.has(item.code)) {
                    throw new ApiError(
                      httpStatus.BAD_REQUEST,
                      `Warranty codes for product '${currentProduct?.productTitle}' - code ${item.code} got more than once`
                    );
                  }
                  seen.add(item.code);
                }

                if (currentProduct?.quantity === 0) {
                  updatedProduct.warrantyCodes = [];
                }

                await Warranty.updateOne(
                  { _id: new Types.ObjectId(currentProduct?.warranty) },
                  {
                    $set: {
                      warrantyCodes: updatedProduct?.warrantyCodes,
                    },
                  }
                );
              }
            }
            if (
              updatedProduct.variation &&
              updatedProduct.variation !== currentProduct.variation?.toString()
            ) {
              const newVariationId = updatedProduct.variation;
              const newVariation = await VariationModel.findById(newVariationId)
                .populate("price inventory")
                .session(session);

              if (!newVariation) {
                throw new ApiError(
                  httpStatus.BAD_REQUEST,
                  "Invalid variation selected"
                );
              }

              const qty =
                updatedProduct.quantity || updatedProduct.quantity === 0
                  ? updatedProduct.quantity
                  : previousQuantity;

              // 1. Restore stock of the old state (variation or simple)
              if (currentProduct.variation) {
                const oldInv =
                  currentProduct?.inventoryInfo?.variationInventory;
                if (oldInv?.manageStock) {
                  const quantityCalculation =
                    Number(oldInv.stockAvailable || 0) + previousQuantity;
                  const newStatus = calculateStockStatus(
                    quantityCalculation,
                    oldInv.lowStockWarning || 0
                  );
                  await InventoryModel.updateOne(
                    { _id: oldInv._id },
                    {
                      $set: {
                        stockAvailable: quantityCalculation,
                        stockStatus: newStatus,
                      },
                    },
                    { session }
                  );
                }
              } else {
                const oldInv = currentProduct?.inventoryInfo?.defaultInventory;
                if (oldInv?.manageStock) {
                  const quantityCalculation =
                    Number(oldInv.stockAvailable || 0) + previousQuantity;
                  const newStatus = calculateStockStatus(
                    quantityCalculation,
                    oldInv.lowStockWarning || 0
                  );
                  await InventoryModel.updateOne(
                    { _id: oldInv._id },
                    {
                      $set: {
                        stockAvailable: quantityCalculation,
                        stockStatus: newStatus,
                      },
                    },
                    { session }
                  );
                }
              }

              // 2. Decrease stock of the new variation
              const newInv = newVariation.inventory as TInventory;
              if (newInv?.manageStock) {
                if (qty > Number(newInv.stockAvailable || 0)) {
                  throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `Insufficient stock for the selected variation. Available: ${newInv.stockAvailable || 0}, requested: ${qty}.`
                  );
                }
                const quantityCalculation =
                  Number(newInv.stockAvailable || 0) - qty;
                const newStatus = calculateStockStatus(
                  quantityCalculation,
                  newInv.lowStockWarning || 0
                );
                await InventoryModel.updateOne(
                  { _id: newInv._id },
                  {
                    $set: {
                      stockAvailable: quantityCalculation,
                      stockStatus: newStatus,
                    },
                  },
                  { session }
                );
              }

              // 3. Update currentProduct properties
              currentProduct.variation = new Types.ObjectId(newVariationId);
              currentProduct.attributes = newVariation.attributes;

              const unitPrice =
                (newVariation.price as TPrice)?.salePrice ||
                (newVariation.price as TPrice)?.regularPrice ||
                0;
              currentProduct.unitPrice = unitPrice;
              currentProduct.total = unitPrice * qty;

              // 4. Prevent double stock calculation below
              if (currentProduct.inventoryInfo) {
                if (currentProduct.inventoryInfo.variationInventory) {
                  currentProduct.inventoryInfo.variationInventory.manageStock = false;
                }
                if (currentProduct.inventoryInfo.defaultInventory) {
                  currentProduct.inventoryInfo.defaultInventory.manageStock = false;
                }
              }
            } else if (updatedProduct.variation) {
              currentProduct.variation = currentProduct.variation || undefined;
            }

            if (
              currentProduct.isWarrantyClaim &&
              updatedProduct.isWarrantyClaim === false
            ) {
              currentProduct.isWarrantyClaim = false;
              currentProduct.claimedCodes = undefined;
            }

            if (
              currentProduct.isWarrantyClaim &&
              updatedProduct?.claimedCodes?.length
            ) {
              if (
                updatedProduct?.claimedCodes?.length !== currentProduct.quantity
              ) {
                throw new ApiError(
                  httpStatus.BAD_REQUEST,
                  `Please add all warranty claim codes.`
                );
              }
            }

            if (updatedProduct.isWarrantyClaim) {
              currentProduct.isWarrantyClaim = updatedProduct.isWarrantyClaim;
              currentProduct.claimedCodes = updatedProduct.claimedCodes;
              if (
                currentProduct?.claimedCodes?.length !== currentProduct.quantity
              ) {
                throw new ApiError(
                  httpStatus.BAD_REQUEST,
                  `Please add all warranty claim codes.`
                );
              }
            }

            const varObjIdStr = currentProduct.variation
              ? currentProduct.variation.toString()
              : undefined;

            if (
              updatedProduct.variation &&
              updatedProduct.variation !== varObjIdStr
            ) {
              // variation-change path already handled above (manageStock was set to false to prevent double calculation)
            } else if (
              currentProduct?.inventoryInfo?.variationInventory?.variation &&
              currentProduct.inventoryInfo.variationInventory.manageStock ===
                true
            ) {
              const inv = currentProduct.inventoryInfo.variationInventory;
              const effectiveStock =
                Number(inv.stockAvailable || 0) + previousQuantity;

              if (updatedProduct.quantity > effectiveStock) {
                throw new ApiError(
                  httpStatus.BAD_REQUEST,
                  `Insufficient stock for '${currentProduct.productTitle}'. Available: ${effectiveStock}, requested: ${updatedProduct.quantity}.`
                );
              }

              const quantityCalculation =
                effectiveStock - updatedProduct.quantity;
              const inventoryId = inv._id;
              const newStatus = calculateStockStatus(
                quantityCalculation,
                inv.lowStockWarning || 0
              );

              await InventoryModel.updateOne(
                { _id: inventoryId },
                {
                  $set: {
                    stockAvailable: quantityCalculation,
                    stockStatus: newStatus,
                  },
                },
                { session }
              );
            }
            if (!currentProduct.variation) {
              if (
                currentProduct?.inventoryInfo?.defaultInventory?.manageStock
              ) {
                const inv = currentProduct.inventoryInfo.defaultInventory;
                const effectiveStock =
                  Number(inv.stockAvailable || 0) + previousQuantity;

                if (updatedProduct.quantity > effectiveStock) {
                  throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `Insufficient stock for '${currentProduct.productTitle}'. Available: ${effectiveStock}, requested: ${updatedProduct.quantity}.`
                  );
                }

                const quantityCalculation =
                  effectiveStock - updatedProduct.quantity;
                const newStatus = calculateStockStatus(
                  quantityCalculation,
                  inv.lowStockWarning || 0
                );
                await InventoryModel.updateOne(
                  { _id: inv._id },
                  {
                    $set: {
                      stockAvailable: quantityCalculation,
                      stockStatus: newStatus,
                    },
                  },
                  { session }
                );
              }
            }
          }
        } else if (updatedProduct.product) {
          const productInfo = (
            await ProductModel.aggregate([
              {
                $match: {
                  _id: new Types.ObjectId(updatedProduct.product),
                },
              },
              {
                $lookup: {
                  from: "prices",
                  localField: "price",
                  foreignField: "_id",
                  as: "priceInfo",
                },
              },
              {
                $unwind: {
                  path: "$priceInfo",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: "variations",
                  let: { variations: "$variations" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $in: ["$_id", { $ifNull: ["$$variations", []] }],
                        },
                      },
                    },
                    {
                      $lookup: {
                        from: "prices",
                        localField: "price",
                        foreignField: "_id",
                        as: "price",
                      },
                    },
                    {
                      $unwind: {
                        path: "$price",
                        preserveNullAndEmptyArrays: true,
                      },
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
                      $unwind: {
                        path: "$inventory",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                  ],
                  as: "variations",
                },
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
                $unwind: {
                  path: "$inventory",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  price: "$priceInfo",
                  inventory: 1,
                  variations: 1,
                  id: 1,
                  title: 1,
                },
              },
            ])
          )[0] as {
            _id: Types.ObjectId;
            id: string;
            title: string;
            price: TPrice;
            inventory: TInventory;
            variations: TVariation[];
          };
          if (!productInfo) {
            throw new ApiError(httpStatus.BAD_REQUEST, "No product found");
          }
          if (productInfo?.variations?.length)
            if (!updatedProduct?.variation)
              throw new ApiError(httpStatus.BAD_REQUEST, "Select a variation");

          const selectedVariation = productInfo?.variations?.find(
            (item) =>
              (item as unknown as Types.ObjectId)?._id.toString() ===
              updatedProduct?.variation?.toString()
          );

          if (productInfo?.variations?.length)
            if (!selectedVariation)
              throw new ApiError(httpStatus.BAD_REQUEST, "Invalid variation");
          const { salePrice, regularPrice } = (productInfo?.price ||
            {}) as TPrice;
          const unitPrice = salePrice || regularPrice || 0;
          const variationUnitPrice =
            (selectedVariation?.price as TPrice)?.salePrice ||
            (selectedVariation?.price as TPrice)?.regularPrice ||
            0;

          const newOrderedProducts = {
            product: productInfo?._id,
            attributes: selectedVariation?.attributes,
            unitPrice: selectedVariation ? variationUnitPrice : unitPrice,
            quantity: updatedProduct.quantity,
            total: selectedVariation
              ? Number(variationUnitPrice) * updatedProduct.quantity
              : unitPrice * updatedProduct.quantity,
            warranty: updatedProduct.warranty,
            isWarrantyClaim: updatedProduct.isWarrantyClaim,
            claimedCodes: updatedProduct.claimedCodes,
            variation: (selectedVariation as TVariation)?._id || undefined,
          };

          if (newOrderedProducts?.isWarrantyClaim) {
            if (
              newOrderedProducts?.claimedCodes?.length !==
              newOrderedProducts?.quantity
            ) {
              throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Please add all warranty claim codes.`
              );
            }
          }

          if (newOrderedProducts) {
            findOrder.orderedProducts.push(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              newOrderedProducts as any
            );
          }
          if (selectedVariation) {
            const varInv = selectedVariation?.inventory as TInventory;
            if (varInv?.manageStock) {
              if (
                updatedProduct.quantity > Number(varInv.stockAvailable || 0)
              ) {
                throw new ApiError(
                  httpStatus.BAD_REQUEST,
                  `Insufficient stock for the selected variation. Available: ${varInv.stockAvailable || 0}, requested: ${updatedProduct.quantity}.`
                );
              }
              const quantityCalculation =
                Number(varInv.stockAvailable || 0) - updatedProduct.quantity;
              const newStatus = calculateStockStatus(
                quantityCalculation,
                varInv.lowStockWarning || 0
              );

              await InventoryModel.updateOne(
                { _id: varInv._id },
                {
                  $set: {
                    stockAvailable: quantityCalculation,
                    stockStatus: newStatus,
                  },
                },
                { session }
              );
            }
          } else {
            if (productInfo.inventory.manageStock) {
              if (
                updatedProduct.quantity >
                Number(productInfo.inventory.stockAvailable || 0)
              ) {
                throw new ApiError(
                  httpStatus.BAD_REQUEST,
                  `Insufficient stock for '${productInfo.title}'. Available: ${productInfo.inventory.stockAvailable || 0}, requested: ${updatedProduct.quantity}.`
                );
              }
              const quantityCalculation =
                Number(productInfo.inventory.stockAvailable || 0) -
                updatedProduct.quantity;
              const newStatus = calculateStockStatus(
                quantityCalculation,
                productInfo.inventory.lowStockWarning || 0
              );
              await InventoryModel.updateOne(
                { _id: productInfo?.inventory?._id },
                {
                  $set: {
                    stockAvailable: quantityCalculation,
                    stockStatus: newStatus,
                  },
                },
                { session }
              );
            }
          }
        }
      }

      findOrder.orderedProducts.forEach((product) => {
        if (product.isWarrantyClaim) {
          newWarrantyAmount += product.total;
        } else {
          newSubtotal += product.total;
        }
      });

      updatedDoc.orderedProducts = findOrder.orderedProducts;
    } else {
      newSubtotal = Number(findOrder.subtotal || 0);
      newWarrantyAmount = Number(findOrder.warrantyAmount || 0);
    }
    updatedDoc.subtotal = newSubtotal;
    updatedDoc.warrantyAmount = newWarrantyAmount;
    // Update shipping chare
    if (payload?.shippingCharge) {
      const shippingCost = await ShippingCharge.findById(
        payload.shippingCharge
      );
      if (!shippingCost) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Failed to find shipping charge"
        );
      }
      const shippingCostTotal = Number(shippingCost?.amount);

      updatedDoc.shippingCharge = shippingCost?._id;
      increments += Number(shippingCostTotal);
    } else {
      increments += Number(
        (findOrder.shippingCharge as TShippingCharge).amount
      );
    }

    // Update -- advance, If there is any advance or the advance is 0
    if (advance || advance === 0) {
      updatedDoc.advance = advance;
      decrements += advance;
    } else {
      decrements += findOrder.advance || 0;
    }

    // Update -- discount, If there is any discount or the discount is 0
    if (discount || discount === 0) {
      updatedDoc.discount = discount;
      decrements += discount;
    } else {
      decrements += findOrder.discount || 0;
    }

    // if the order have any coupon discount
    if (findOrder.couponDiscount) {
      decrements += findOrder.couponDiscount;
    }

    if (status) {
      if (status !== "partial completed")
        throw new ApiError(httpStatus.BAD_REQUEST, `Can't change to ${status}`);
      updatedDoc.status = status;
    }
    updatedDoc.monitoringStatus = monitoringStatus;
    updatedDoc.trackingStatus = trackingStatus;

    const totalIncDec = increments - decrements;

    updatedDoc.total = newSubtotal + totalIncDec;
    updatedDoc.invoiceNotes = invoiceNotes;
    updatedDoc.officialNotes = officialNotes;
    updatedDoc.courierNotes = courierNotes;
    updatedDoc.followUpDate = followUpDate;
    updatedDoc.monitoringNotes = monitoringNotes;
    updatedDoc.reasonNotes = reasonNotes;

    await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          ...updatedDoc,
        },
      },
      { session, new: true }
    );

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

/* -----------------------------------------
              Delete order 
-------------------------------------------- */
const deleteOrders = async (orderIds: string[]) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const pipeline = OrderHelper.orderStatusUpdatingPipeline(
      orderIds.map((id) => new Types.ObjectId(id)),
      orderStatus
    );

    const orders = await Order.aggregate(pipeline).session(session);

    for (const order of orders) {
      await updateStockOrderCancelDelete(
        order.orderedProducts as unknown as TUpStOnCanDelProducts[],
        session
      );

      await Order.updateOne(
        { _id: order._id },
        { status: "deleted", isDeleted: true },
        { session }
      );
    }
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/* -----------------------------------------
              Get orders counts
-------------------------------------------- */
const getOrderCountsByStatus = async () => {
  const statusMap = {
    all: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    "follow up": 0,
    canceled: 0,
    deleted: 0,
  };
  const pipeline = [
    {
      $match: {
        status: {
          $in: Object.keys(statusMap).filter((status) => status !== "all"),
        },
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ];

  const result = await Order.aggregate(pipeline);

  result.forEach(({ _id, total }) => {
    statusMap[_id as keyof typeof statusMap] = total;
    if (!["canceled", "deleted"].includes(_id)) {
      statusMap.all += total;
    }
  });

  const formattedResult = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));

  return formattedResult;
};

/* -----------------------------------------
        Get a customers orders counts
-------------------------------------------- */
const getCustomerOrderCountByPhone = async (phoneNumber: string) => {
  const orders = await Order.aggregate([
    {
      $lookup: {
        from: "shippings",
        localField: "shipping",
        foreignField: "_id",
        as: "shippingData",
      },
    },
    {
      $unwind: "$shippingData",
    },
    {
      $match: {
        "shippingData.phoneNumber": phoneNumber,
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ]);
  const statusMap = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    "warranty processing": 0,
    "follow up": 0,
    "processing done": 0,
    "warranty added": 0,
    "on courier": 0,
    canceled: 0,
    returned: 0,
    "partly returned": 0,
    completed: 0,
    "partial completed": 0,
    deleted: 0,
  };
  orders.forEach(({ _id, total }) => {
    statusMap[_id as keyof typeof statusMap] = total;
  });
  const formattedCount = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));
  return formattedCount;
};

/* -----------------------------------------
      Get a guest customers order history
-------------------------------------------- */
const getGuestOrdersByPhone = async (phoneNumber: string) => {
  const pipeline = [
    {
      $lookup: {
        from: "shippings",
        localField: "shipping",
        foreignField: "_id",
        as: "shippingData",
      },
    },
    {
      $unwind: "$shippingData",
    },
    {
      $match: {
        "shippingData.phoneNumber": phoneNumber,
      },
    },
    {
      $sort: { createdAt: -1 as const },
    },
    ...OrderHelper.orderDetailsCustomerPipeline(),
  ];

  const result = await Order.aggregate(pipeline);
  return result;
};

/* -----------------------------------------
        Track order
-------------------------------------------- */
const getOrderTrackingInfo = async (orderId: string) => {
  const pipeline: PipelineStage[] = [
    {
      $match: { orderId },
    },
    {
      $lookup: {
        from: "orderstatushistories",
        localField: "statusHistory",
        foreignField: "_id",
        as: "statusHistoryDetails",
      },
    },
    {
      $unwind: "$statusHistoryDetails",
    },
    {
      $lookup: {
        from: "shippings",
        localField: "shipping",
        foreignField: "_id",
        as: "shippingData",
      },
    },
    {
      $unwind: "$shippingData",
    },
    {
      $lookup: {
        from: "couriers",
        localField: "courierDetails.courierProvider",
        foreignField: "_id",
        as: "courierDetailsData",
      },
    },
    {
      $unwind: {
        path: "$courierDetailsData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        status: 1,
        statusHistory: {
          $map: {
            input: "$statusHistoryDetails.history",
            as: "history",
            in: {
              status: "$$history.status",
              createdAt: "$$history.createdAt",
            },
          },
        },
        shipping: {
          fullName: "$shippingData.fullName",
          fullAddress: "$shippingData.fullAddress",
          phoneNumber: "$shippingData.phoneNumber",
          email: "$shippingData.email",
          upazila: "$shippingData.upazila",
          district: "$shippingData.district",
        },
        parcelTrackingLink: {
          $cond: {
            if: { $eq: ["$courierDetailsData.slug", "steadfast"] },
            then: {
              $concat: [
                "https://steadfast.com.bd/t/",
                "$courierDetails.trackingId",
              ],
            },
            else: {
              $cond: {
                if: { $eq: ["$courierDetailsData.slug", "pathao"] },
                then: "c2",
                else: null, // Default value if none of the conditions match
              },
            },
          },
        },
      },
    },
  ];

  const result = (await Order.aggregate(pipeline))[0];

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (result && result.shipping) {
    result.shipping.fullAddress = formatShippingAddress(result.shipping);
  }

  const updatedStatusHistory = (
    result.statusHistory as { status: TOrderStatus; createdAt: string }[]
  ).reduce((acc: (TOrderStatusWithDesc & { createdAt: string })[], current) => {
    if (acc.length === 0 || acc[acc.length - 1].status !== current.status) {
      const currentStatusDesc = orderStatusWithDesc.find(
        (item) => item.status === current.status
      );
      acc.push({
        status: current.status,
        description: currentStatusDesc?.description || { bn: "", en: "" },
        createdAt: current.createdAt,
      });
    }
    return acc;
  }, []);

  result.statusHistory = updatedStatusHistory;
  return result;
};

/* -----------------------------------------
    Manage return and partial return orders
-------------------------------------------- */
const updateMonitorDeliveryOrderStatus = async (
  orderIds: mongoose.Types.ObjectId[],
  status: Partial<TOrderStatus>,
  user: TJwtPayload
) => {
  const changeableStatus: Partial<TOrderStatus[]> = ["on courier"];
  const acceptableStatus = ["completed", "partial completed", "returned"];
  if (![...acceptableStatus].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Can't change to ${status}`);
  }

  if (orderIds.length > maxOrderStatusChangeAtATime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't update more than ${maxOrderStatusChangeAtATime} orders at a time`
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const pipeline = OrderHelper.orderStatusUpdatingPipeline(
      orderIds,
      changeableStatus
    );
    const orders = await Order.aggregate(pipeline).session(session);

    for (const order of orders) {
      // Update order status
      await Order.updateOne({ _id: order._id }, { status }, { session });
      // Update order status history
      await OrderStatusHistory.updateOne(
        { _id: order.statusHistory },
        {
          $push: {
            history: {
              status,
              updatedBy: user.id,
            },
          },
        },
        { session }
      );

      if (status === "returned") {
        await Promise.all([
          updateStockOrderCancelDelete(order.orderedProducts, session),
          deleteWarrantyFromOrder(order.orderedProducts, order._id, session),
        ]);
      }
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/* -----------------------------------------
   Get mobile numbers for sending SMS
-------------------------------------------- */

const getPhoneNumbersForSMS = async (query: Record<string, unknown>) => {
  const matchQuery: Record<string, unknown> = {};
  const matchShippingQuery: Record<string, unknown> = {};

  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "shippings",
        localField: "shipping",
        foreignField: "_id",
        as: "shippingInfo",
      },
    },
    {
      $unwind: {
        path: "$shippingInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  // Filter shippingInfo.district and division early
  if (query.division) {
    matchShippingQuery["shippingInfo.division"] = query.division;
  }
  if (query.district) {
    matchShippingQuery["shippingInfo.district"] = query.district;
  }
  if (query.upazila) {
    matchShippingQuery["shippingInfo.upazila"] = query.upazila;
  }

  if (Object.keys(matchShippingQuery).length) {
    pipeline.push({ $match: matchShippingQuery });
  }

  // Now group safely
  pipeline.push(
    {
      $group: {
        _id: "$shippingInfo.phoneNumber",
      },
    },
    {
      $group: {
        _id: null,
        phoneNumbers: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        _id: 0,
        phoneNumbers: 1,
      },
    }
  );

  // Handle main matchQuery (createdAt, status, etc.)
  if (query.startFrom) {
    const startTime = convertIso(query.startFrom.toString());
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $gte: startTime,
    };
  }
  if (query.endAt) {
    const endTime = convertIso(query.endAt.toString(), false);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $lte: endTime,
    };
  }
  if (query.productIds) {
    const ids = (query.productIds as string).split(",");
    matchQuery["orderedProducts.product"] = {
      $in: ids.map((id) => new Types.ObjectId(id)),
    };
  }
  if (query.status) {
    const statuses = (query.status as string).split(",");
    matchQuery.status = { $in: statuses };
  }

  if (query.orderSource) {
    matchQuery.orderSource = query.orderSource;
  }

  if (Object.keys(matchQuery).length) {
    pipeline.unshift({ $match: matchQuery });
  }

  if (
    Object.keys(matchQuery).length === 0 &&
    Object.keys(matchShippingQuery).length === 0
  ) {
    return { phoneNumbers: null };
  }

  const result = (await Order.aggregate(pipeline))[0];

  return result;
};

/* -----------------------------------------
          Schedule pickup from order
----------------------------------------- */
const schedulePickupForAOrder = async (
  payload: TSchedulePickup["body"],
  user: TJwtPayload
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findById(payload.order_id)
      .populate("shipping")
      .session(session);

    if (!order) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Order not found.");
    }

    if (order.status !== "processing done") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Only processing done orders can be book for schedule."
      );
    }

    const shippingMethod = await Courier.findById(
      payload.shipping_method_id
    ).session(session);

    if (!shippingMethod) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Shipping method not found.");
    }

    if (!shippingMethod.isActive) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Shipping method is not active."
      );
    }

    const shippingData = order.shipping as unknown as TShipping;

    const pickupInfo: TSchedulePickRequestBody = {
      invoice_id: order.orderId,
      cod_amount: order.total.toString(),
      full_name: shippingData?.fullName ?? "N/A",
      full_address: formatShippingAddress(shippingData as TShippingData),
      phone: shippingData?.phoneNumber ?? "N/A",
      note: order.courierNotes || undefined,
      delivery_area: payload.delivery_area as string,
      delivery_area_id: payload.delivery_area_id as number,
      parcel_weight: payload.parcel_weight as string,
      value: payload.value as string,
      item_quantity: payload.item_quantity as number,
      store_id: payload.store_id as number,
    };

    const result = await schedulePickup(shippingMethod, pickupInfo);

    if (result.success) {
      await Order.updateOne(
        { _id: order._id },
        {
          status: "on courier",
          courierDetails: {
            courierProvider: shippingMethod._id,
            trackingId: result.tracking_code,
          },
          deliveryStatus: result.status,
        },
        { session }
      );

      await OrderStatusHistory.updateOne(
        { _id: order.statusHistory },
        {
          $push: {
            history: {
              status: "on courier",
              updatedBy: user.id,
            },
          },
        },
        { session }
      );

      await OrderHelper.sendOrderSMSNotification(
        {
          fullName: shippingData.fullName || "",
          phoneNumber: shippingData.phoneNumber || "",
          email: shippingData.email || "",
          orderId: order?.orderId || "",
          total: order?.total.toString() || "0",
        },
        "courier_assigned"
      );

      await session.commitTransaction();
      return result;
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        result.message || "Failed to schedule pickup."
      );
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const bulkSchedulePickupForOrders = async (
  payload: {
    order_ids: string[];
    shipping_method_id: string;
  },
  user: TJwtPayload
) => {
  const session = await mongoose.startSession();

  let orders: (TOrderDataForCourier & {
    _id: Types.ObjectId;
    statusHistory: Types.ObjectId;
  })[] = [];
  let shippingMethod: TCourier | null = null;

  try {
    // -------------------------------
    // STEP 1: Validate & Fetch (TX-1)
    // -------------------------------
    await session.startTransaction();

    shippingMethod = await Courier.findById(payload.shipping_method_id).session(
      session
    );

    if (!shippingMethod) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Shipping method not found.");
    }

    if (!shippingMethod.isActive) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Shipping method is not active."
      );
    }

    if (shippingMethod.slug !== "steadfast") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Bulk pickup only supported for Steadfast."
      );
    }

    const orderIds = payload.order_ids.map((id) => new Types.ObjectId(id));

    const pipeline = OrderHelper.orderStatusUpdatingPipeline(orderIds, [
      "processing done",
    ]);

    orders = await Order.aggregate(pipeline).session(session);

    if (!orders.length) {
      await session.abortTransaction();
      return payload.order_ids.map((id) => ({
        order_id: id,
        success: false,
        message: "No valid orders found with 'processing done' status.",
      }));
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }

  // ---------------------------------------
  // STEP 2: Call External API (NO TX)
  // ---------------------------------------
  const { success: successRequests, error: failedRequests } =
    await schedulePickOnSteadfastBulk(orders, shippingMethod as TCourier);

  // Map for O(1) lookup
  const orderMap = new Map(orders.map((o) => [o.orderId, o]));

  const results: {
    order_id: string;
    success: boolean;
    message: string;
    tracking_code?: string;
  }[] = [];

  const orderUpdateQuery: mongoose.AnyBulkWriteOperation<TOrder>[] = [];
  const historyUpdateQuery: mongoose.AnyBulkWriteOperation<TOrderStatusHistoryData>[] =
    [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const smsPromises: Promise<any>[] = [];

  // ---------------------------------------
  // STEP 3: Prepare DB updates
  // ---------------------------------------

  for (const success of successRequests) {
    const order = orderMap.get(success.orderId);

    if (!order) continue;

    orderUpdateQuery.push({
      updateOne: {
        filter: { _id: order._id },
        update: {
          status: "on courier",
          courierDetails: {
            courierProvider: shippingMethod._id,
            trackingId: success.trackingId,
          },
          deliveryStatus: success.status,
        },
      },
    });

    historyUpdateQuery.push({
      updateOne: {
        filter: { _id: order.statusHistory },
        update: {
          $push: {
            history: {
              status: "on courier",
              updatedBy: user.id,
            },
          },
        },
      },
    });

    // Queue SMS (parallel)
    const shippingData = order.shippingData as TShippingData;

    smsPromises.push(
      OrderHelper.sendOrderSMSNotification(
        {
          fullName: shippingData.fullName || "",
          phoneNumber: shippingData.phoneNumber || "",
          email: shippingData.email || "",
          orderId: order.orderId,
          total: order.total?.toString() || "0",
        },
        "courier_assigned"
      )
    );

    results.push({
      order_id: order.orderId,
      success: true,
      message: "Pickup scheduled successfully",
      tracking_code: success.trackingId,
    });
  }

  for (const failed of failedRequests) {
    const order = orderMap.get(failed.orderId);

    results.push({
      order_id: order?.orderId || failed.orderId,
      success: false,
      message:
        failed.message || "Failed to schedule pickup via Steadfast bulk API",
    });
  }

  // ---------------------------------------
  // STEP 4: DB Update (TX-2)
  // ---------------------------------------
  const session2 = await mongoose.startSession();

  try {
    await session2.startTransaction();

    if (orderUpdateQuery.length) {
      await Order.bulkWrite(orderUpdateQuery, { session: session2 });
    }

    if (historyUpdateQuery.length) {
      await OrderStatusHistory.bulkWrite(historyUpdateQuery, {
        session: session2,
      });
    }

    await session2.commitTransaction();
  } catch (error) {
    await session2.abortTransaction();
    throw error;
  } finally {
    await session2.endSession();
  }

  // ---------------------------------------
  // STEP 5: Send SMS (async, no blocking)
  // ---------------------------------------
  Promise.allSettled(smsPromises);

  // ---------------------------------------
  // STEP 6: Handle unprocessed orders
  // ---------------------------------------
  const processedIds = new Set(results.map((r) => r.order_id));

  for (const id of payload.order_ids) {
    if (!processedIds.has(id)) {
      results.push({
        order_id: id,
        success: false,
        message: "Order not eligible or not processed.",
      });
    }
  }

  return results;
};

const getCourierForOrder = async () => {
  const result = await Courier.find({
    isActive: true,
  }).select({
    name: 1,
    slug: 1,
    _id: 1,
  });

  return result;
};

const syncOrderCourierStatus = async (id: string) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query: Record<string, unknown> = {};

  if (isObjectId) {
    query._id = new mongoose.Types.ObjectId(id);
  } else {
    query.orderId = id;
  }

  const order = await Order.findOne(query).populate(
    "courierDetails.courierProvider"
  );
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  const courierDetails = order.courierDetails;
  if (!courierDetails?.courierProvider) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No courier assigned to this order"
    );
  }

  const courier = courierDetails.courierProvider as unknown as TCourier;
  const updatedData: Record<string, string> = {};

  if (courier.slug === "steadfast") {
    const result = await getSteadfastStatusByInvoice(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      courier as any,
      order.orderId
    );

    if (result.status === 200) {
      updatedData.deliveryStatus = result.delivery_status;

      const lowerStatus = result.delivery_status?.toLowerCase();
      if (lowerStatus === "delivered") {
        updatedData.status = "completed";
      } else if (lowerStatus === "cancelled") {
        updatedData.status = "returned";
      } else if (lowerStatus === "partial_delivered") {
        updatedData.status = "partial completed";
      }
    }
  } else if (courier.slug === "pathao") {
    if (!courierDetails.trackingId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Tracking ID (Consignment ID) missing for Pathao order"
      );
    }
    const result = await getPathaoStatusByConsignmentId(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      courier as any,
      courierDetails.trackingId
    );

    if (result.order_status) {
      const lowerStatus = result.order_status.toLowerCase();
      updatedData.deliveryStatus = lowerStatus.replace(/[_-]/g, " ");

      if (lowerStatus === "delivered") {
        updatedData.status = "completed";
      } else if (
        lowerStatus === "returned" ||
        lowerStatus === "delivery-failed"
      ) {
        updatedData.status = "returned";
      } else if (lowerStatus === "partial-delivery") {
        updatedData.status = "partial completed";
      }
    }
  } else if (courier.slug === "paperfly") {
    const result = await getPaperflyStatusByReference(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      courier as any,
      order.orderId
    );

    if (result) {
      if (result.Delivered) {
        updatedData.status = "completed";
        updatedData.deliveryStatus = "Delivered";
      } else if (result.Returned) {
        updatedData.status = "returned";
        updatedData.deliveryStatus = "Returned";
      } else if (result.Partial) {
        updatedData.status = "partial completed";
        updatedData.deliveryStatus = "Partial Delivered";
      } else if (result.PickedForDelivery) {
        updatedData.deliveryStatus = "Picked for Delivery";
      } else if (result.inTransit) {
        updatedData.deliveryStatus = "In Transit";
      } else if (result.ReceivedAtPoint) {
        updatedData.deliveryStatus = "Received at Point";
      } else {
        updatedData.deliveryStatus = "Pending";
      }
    }
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Courier status sync is not supported for ${courier.name}`
    );
  }

  if (Object.keys(updatedData).length > 0) {
    await Order.updateOne({ _id: order._id }, { $set: updatedData });
    return { ...updatedData, orderId: order.orderId };
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to fetch valid status from courier"
    );
  }
};

export const OrderServices = {
  createOrder,
  updateOrderStatus,
  updateProcessingOrderStatus,
  getAllOrdersForCustomer,
  getOrderDetailsForCustomer,
  getOrderDetailsForAdmin,
  getAllOrdersForAdmin,
  getCompletedOrders,
  updateOrderDetails,
  deleteOrders,
  getOrderCountsByStatus,
  getProcessingOrders,
  getCourierShipmentOrders,
  getCustomerOrderCountByPhone,
  getOrderTrackingInfo,
  getMonitorDeliveryOrders,
  updateMonitorDeliveryOrderStatus,
  getPhoneNumbersForSMS,
  schedulePickupForAOrder,
  bulkSchedulePickupForOrders,
  getCourierForOrder,
  getGuestOrdersByPhone,
  syncOrderCourierStatus,
};
