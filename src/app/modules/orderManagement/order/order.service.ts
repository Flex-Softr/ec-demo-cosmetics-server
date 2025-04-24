import { Request } from "express";
import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import updateCourierStatus from "../../../helper/updateCourierStatus";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import { convertIso } from "../../../utilities/ISOConverter";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { Courier } from "../../courier/courier.model";
import { TInventory } from "../../productManagement/inventory/inventory.interface";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import { TPrice } from "../../productManagement/price/price.interface";
import { TVariation } from "../../productManagement/product/product.interface";
import ProductModel from "../../productManagement/product/product.model";
import { Warranty } from "../../warrantyManagement/warranty/warranty.model";
import { OrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.model";
import { TShipping } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { TShippingCharge } from "../shippingCharge/shippingCharge.interface";
import { ShippingCharge } from "../shippingCharge/shippingCharge.model";
import { orderStatusWithDesc } from "./order.const";
import { OrderHelper } from "./order.helper";
import {
  TOrder,
  TOrderDeliveryStatus,
  TOrderStatus,
  TProductDetails,
  TSMSReceiverInfo,
} from "./order.interface";
import { Order } from "./order.model";
// import steedFastApi from "../../../utilities/steedfastApi";
import {
  createNewOrder,
  createOrderOnSteedFast,
  deleteWarrantyFromOrder,
  TUpStOnCanDelProducts,
  updateStockOrderCancelDelete,
} from "./order.utils";

const maxOrderStatusChangeAtATime = 20;

/* -----------------------------------------
          Create order
----------------------------------------- */
const createOrderIntoDB = async (req: Request) => {
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
const getAllOrdersAdminFromDB = async (query: Record<string, string>) => {
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
      "On courier",
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
const getProcessingOrdersAdminFromDB = async (
  query: Record<string, string>
) => {
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
      "On courier",
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
const getProcessingDoneCourierOrdersAdminFromDB = async (
  query: Record<string, string>
) => {
  const matchQuery: Record<string, unknown> = {};
  const acceptableStatus: TOrderStatus[] = ["processing done", "On courier"];

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
    "On courier": 0,
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
        Get delivery details
----------------------------------------- */
const getOrdersByDeliveryStatusFromDB = async (
  query: Record<string, string>
) => {
  const matchQuery: Record<string, unknown> = {};
  const acceptableStatus: TOrderDeliveryStatus[] = [
    "in_review",
    "pending",
    "hold",
    "delivered_approval_pending",
    "cancelled_approval_pending",
    "partial_delivered_approval_pending",
    "unknown_approval_pending",
    "delivered",
    "cancelled",
    "partial_delivered",
    "unknown",
  ];

  if (query.deliveryStatus) {
    matchQuery.deliveryStatus = query?.deliveryStatus as string;
  }

  if (
    (!query.deliveryStatus || query.deliveryStatus === "all") &&
    !query.search
  ) {
    matchQuery.deliveryStatus = {
      $in: acceptableStatus,
    };
  }

  const pipeline = OrderHelper.orderDetailsPipeline();

  pipeline.unshift({
    $match: { ...matchQuery, status: "On courier" },
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
      { $match: { ...matchQuery, status: "On courier" } },
      { $count: "total" },
    ]))![0]?.total || 0;
  const meta = orderQuery.metaData(total);

  // Orders counts
  const statusMap = {
    in_review: 0,
    pending: 0,
    hold: 0,
    delivered_approval_pending: 0,
    cancelled_approval_pending: 0,
    partial_delivered_approval_pending: 0,
    unknown_approval_pending: 0,
    delivered: 0,
    cancelled: 0,
    partial_delivered: 0,
  };
  const countRes = await Order.aggregate([
    {
      $match: {
        deliveryStatus: {
          $in: Object.keys(statusMap),
        },
        status: "On courier",
      },
    },
    {
      $group: {
        _id: "$deliveryStatus",
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
          Get completed orders
----------------------------------------- */
const getCompletedOrdersAdminFromDB = async (query: Record<string, string>) => {
  let queryProducts: string[] = [];
  const orderedTimes: string | undefined = query.orderedTimes;

  if (query.products) {
    queryProducts = Array.isArray(query.products)
      ? query.products
      : [query.products];
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
      "On courier",
      "canceled",
      "deleted",
      "processing",
      "processing done",
      "warranty added",
      "warranty processing"
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

  if (query.division) {
    matchQuery.division = query.division;
  }
  if (query.district) {
    matchQuery.district = query.district;
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

  let matchSuffix: Record<string, unknown> = {};

  if (query.search) {
    const searchRegex = new RegExp(query.search, "i"); // 'i' for case-insensitive matching
    matchSuffix.$or = [
      { "shipping.phoneNumber": { $regex: searchRegex } },
      { "shipping.fullName": { $regex: searchRegex } },
      { division: { $regex: searchRegex } },
      { district: { $regex: searchRegex } },
      { orderId: { $regex: searchRegex } },
    ];
  }

  if (queryProducts.length > 0) {
    matchSuffix = {
      ...matchSuffix,
      "products.productId": {
        $in: queryProducts.map((item) => new Types.ObjectId(item)),
      },
    };
  }

  if (orderedTimes) {
    const groupedOrders = await Order.aggregate([
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
        $group: {
          _id: "$shippingData.phoneNumber",
          orders: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 1,
          orders: 1,
          orderedTimes: { $size: "$orders" },
        },
      },
      {
        $match: {
          orderedTimes: { $eq: Number(orderedTimes) },
        },
      },
    ]);

    const matchedOrderIds = groupedOrders.flatMap((group) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      group.orders.map((order: { _id: any }) => order._id)
    );

    matchSuffix = {
      ...matchSuffix,
      _id: { $in: matchedOrderIds },
    };
  }

  if (Object.keys(matchSuffix).length > 0) {
    pipeline.push({ $match: { ...matchSuffix } });
  }

  const orderQuery = new AggregateQueryHelper(Order.aggregate(pipeline), query)
    .sort()
    .paginate();

  const data = await orderQuery.model;

  const total =
    (await Order.aggregate([...pipeline, { $count: "total" }]))![0]?.total || 0;
  const meta = orderQuery.metaData(total);

  // Orders counts
  const statusMap = {
    completed: 0,
    "partial completed": 0,
    returned: 0,
    canceled: 0,
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
          Get single orders data
----------------------------------------- */
const getOrderInfoByOrderIdAdminFromDB = async (
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
const getAllOrdersCustomerFromDB = async (user: TOptionalAuthGuardPayload) => {
  const userQuery = optionalAuthUserQuery(user);
  if (userQuery.userId) {
    userQuery.userId = new Types.ObjectId(userQuery.userId);
  }

  const matchQuery = {
    ...userQuery,
  };

  const pipeline = [
    { $match: matchQuery },
    ...OrderHelper.orderDetailsCustomerPipeline(),
  ];

  const result = await Order.aggregate(pipeline);
  return result;
};

/* -----------------------------------------
    Get single order info for customers
-------------------------------------------- */
const getOrderInfoByOrderIdCustomerFromDB = async (
  user: TOptionalAuthGuardPayload,
  id: string
) => {
  const userQuery = optionalAuthUserQuery(user);
  if (userQuery.userId) {
    userQuery.userId = new Types.ObjectId(userQuery.userId);
  }

  const matchQuery = {
    ...userQuery,
    _id: new Types.ObjectId(id),
  };

  const pipeline = [
    { $match: matchQuery },
    ...OrderHelper.orderDetailsCustomerPipeline(),
  ];
  const result = (await Order.aggregate(pipeline))[0];

  return result;
};

/* -----------------------------------------
        Update order initial status
-------------------------------------------- */
const updateOrderStatusIntoDB = async (
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
            filter: { _id: order?._id },
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
          order?.productDetails as unknown as TUpStOnCanDelProducts[];
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
          fullName: shipping.fullName || "",
          phoneNumber: shipping.phoneNumber || "",
          orderId: shipping.orderId || "",
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
const updateProcessingStatusIntoDB = async (
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
  const acceptableStatus = ["warranty added", "processing done", "canceled"];
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
        } of order.productDetails) {
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
        await Promise.all([
          updateStockOrderCancelDelete(order.productDetails, session),
          deleteWarrantyFromOrder(order.productDetails, order._id, session),
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
                Book courier
-------------------------------------------- */
const bookCourierAndUpdateStatusIntoDB = async (
  orderIds: mongoose.Types.ObjectId[],
  status: Partial<TOrderStatus>,
  courierProvider: Types.ObjectId,
  user: TJwtPayload
) => {
  if (!["On courier", "canceled", "completed"].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Can't change to ${status}`);
  }
  if (orderIds.length > maxOrderStatusChangeAtATime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't update more than ${maxOrderStatusChangeAtATime} orders at a time`
    );
  }

  let successCourierOrders: {
    orderId?: string;
    trackingId?: string;
    status?: string;
  }[] = [];
  let failedCourierOrders = [];

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const pipeline = OrderHelper.orderStatusUpdatingPipeline(orderIds, [
      "processing done",
    ]);
    const orders = await Order.aggregate(pipeline).session(session);

    // courier booking request
    //Steed fast
    if (status === "On courier") {
      const courier = await Courier.findById(courierProvider, {
        name: 1,
        slug: 1,
        credentials: 1,
        isActive: 1,
      });

      if (!courier)
        throw new ApiError(httpStatus.BAD_REQUEST, "No courier data found");
      if (!courier.isActive)
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Courier '${courier.name}' is not active`
        );
      if (courier.slug === "steedfast") {
        const { success: successRequests, error: failedRequests } =
          await createOrderOnSteedFast(orders, courier);

        successCourierOrders = successRequests;
        failedCourierOrders = failedRequests.map((item) => item.orderId);
      }
    }

    let ordersForUpdateIntoDB = orders;
    if (failedCourierOrders.length) {
      const courierOrdersOrderId = successCourierOrders.map(
        (item) => item.orderId
      );
      ordersForUpdateIntoDB = orders.filter((item) =>
        courierOrdersOrderId.includes(item?.orderId)
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderUpdateQuery: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historyUpdateQuery: any[] = [];
    ordersForUpdateIntoDB.forEach((order) => {
      if (status === "On courier") {
        const trackingId = successCourierOrders.find(
          (item) => item.orderId === order?.orderId
        )?.trackingId;
        orderUpdateQuery.push({
          updateOne: {
            filter: { _id: order?._id },
            update: {
              status,
              courierDetails: { courierProvider, trackingId },
              deliveryStatus: "in_review",
            },
          },
        });
      }
      historyUpdateQuery.push({
        updateOne: {
          filter: { _id: order?.statusHistory },
          update: {
            $push: {
              history: {
                status,
                updatedBy: user.id,
              },
            },
          },
        },
      });
    });

    // Update status on our DB
    if (status === "canceled") {
      await Order.updateMany(
        { _id: orders.map((item) => new Types.ObjectId(item?._id)) },
        { $set: { status: "canceled" } },
        { session }
      );

      for (const order of orders) {
        await updateStockOrderCancelDelete(
          order?.productDetails || [],
          session
        );
        if (
          (order?.productDetails as TProductDetails[]).map(
            (item) => item.warranty
          ).length
        ) {
          await deleteWarrantyFromOrder(
            order?.productDetails || [],
            order?._id,
            session
          );
        }
      }
    } else if (status === "On courier") {
      await Order.bulkWrite(orderUpdateQuery, { session });
    } else if (status === "completed") {
      await Order.updateMany(
        { _id: orders.map((item) => new Types.ObjectId(item?._id)) },
        { $set: { status: "completed" } },
        { session }
      );
    }
    await OrderStatusHistory.bulkWrite(historyUpdateQuery, { session });

    let SMSReviverInformations: TSMSReceiverInfo[] = [];

    if (status === "On courier") {
      SMSReviverInformations = successCourierOrders.map((order) => {
        const shipping = orders.find((item) => item.orderId === order.orderId)
          ?.shippingData as TShipping;

        return {
          fullName: shipping.fullName || "",
          phoneNumber: shipping.phoneNumber || "",
          orderId: shipping.orderId || "",
          trackingId: order.trackingId || "",
        };
      });
    }

    if (status === "canceled") {
      SMSReviverInformations = orders.map((order) => {
        const shipping = (order as unknown as { shippingData: TShipping })
          ?.shippingData;

        return {
          fullName: shipping.fullName || "",
          phoneNumber: shipping.phoneNumber || "",
          orderId: shipping.orderId || "",
        };
      });
    }

    if (SMSReviverInformations.length) {
      SMSReviverInformations.forEach(async (receiver) => {
        await OrderHelper.sendOrderSMSNotification(
          receiver,
          status === "On courier"
            ? "courier_assigned"
            : status === "canceled"
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

  const message = status === "canceled" ? "Canceled successfully." : undefined;

  return {
    success: status === "On courier" ? successCourierOrders?.length : undefined,
    error: status === "On courier" ? failedCourierOrders?.length : undefined,
    message,
  };
};

/* -----------------------------------------
    Update order details by admin
-------------------------------------------- */
const updateOrderDetailsByAdminIntoDB = async (
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
    productDetails: updatedProductDetails,
    status,
    monitoringStatus,
    trackingStatus,
    division,
    district,
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

    const updatedDoc: Record<string, unknown> = {};
    let increments = 0;
    let decrements = 0;

    // Update -- product details and recalculate subtotal
    let newSubtotal = 0;
    let newWarrantyAmount = 0;
    if (
      updatedProductDetails ||
      (updatedProductDetails as unknown as TProductDetails[])?.length > 0
    ) {
      for (const updatedProduct of updatedProductDetails || []) {
        if (updatedProduct.id) {
          const existingProductIndex = findOrder.productDetails.findIndex(
            (product) =>
              product?._id?.toString() === updatedProduct?.id?.toString()
          );

          if (updatedProduct.isDelete) {
            const removedProduct = findOrder.productDetails.splice(
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
            }
          } else {
            // Update existing product details
            const currentProduct =
              findOrder.productDetails[existingProductIndex];
            const previousQuantity = currentProduct.quantity;
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
            if (updatedProduct.variation)
              currentProduct.variation = currentProduct.variation || undefined;

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

            if (currentProduct.variation) {
              if (
                currentProduct?.inventoryInfo?.variationInventory?.variation
              ) {
                const quantityCalculation =
                  Number(
                    currentProduct?.inventoryInfo?.variationInventory
                      ?.stockAvailable || 0
                  ) +
                  previousQuantity -
                  updatedProduct.quantity;
                await ProductModel.updateOne(
                  {
                    _id: currentProduct.product,
                    "variations._id": currentProduct.variation,
                  },
                  {
                    "variations.$.inventory.stockAvailable":
                      quantityCalculation,
                  }
                ).session(session);
              }
            } else {
              const quantityCalculation =
                Number(
                  currentProduct?.inventoryInfo?.defaultInventory
                    ?.stockAvailable || 0
                ) +
                previousQuantity -
                updatedProduct.quantity;
              await InventoryModel.updateOne(
                { _id: currentProduct?.inventoryInfo?.defaultInventory?._id },
                { stockAvailable: quantityCalculation },
                { session }
              );
            }
          }
        } else if (updatedProduct.newProductId) {
          const productInfo = (
            await ProductModel.aggregate([
              {
                $match: {
                  _id: new Types.ObjectId(updatedProduct.newProductId),
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
                $unwind: "$priceInfo",
              },
              {
                $project: {
                  price: "$priceInfo",
                  inventory: 1,
                  variations: 1,
                },
              },
            ])
          )[0] as {
            _id: Types.ObjectId;
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
          const { salePrice, regularPrice } = productInfo?.price as TPrice;
          const unitPrice = salePrice || regularPrice;
          const variationUnitPrice =
            selectedVariation?.price.salePrice ||
            selectedVariation?.price.regularPrice;

          const newProductDetails = {
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
            variation:
              (selectedVariation as unknown as { _id: Types.ObjectId })?._id ||
              undefined,
          };

          if (newProductDetails?.isWarrantyClaim) {
            if (
              newProductDetails?.claimedCodes?.length !==
              newProductDetails?.quantity
            ) {
              throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Please add all warranty claim codes.`
              );
            }
          }

          if (newProductDetails) {
            findOrder.productDetails.push(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              newProductDetails as any
            );
          }

          if (selectedVariation) {
            if (selectedVariation?.inventory?.manageStock) {
              await ProductModel.updateOne(
                {
                  _id: productInfo._id,
                  "variations._id": (
                    selectedVariation as unknown as { _id: Types.ObjectId }
                  )._id,
                },
                {
                  $inc: {
                    "variations.$.inventory.stockAvailable":
                      -updatedProduct.quantity,
                  },
                }
              ).session(session);
            }
          } else {
            if (productInfo.inventory.manageStock) {
              await InventoryModel.updateOne(
                { _id: productInfo?.inventory?._id },
                { $inc: { stockAvailable: -updatedProduct.quantity } },
                { session }
              );
            }
          }
        }
      }

      findOrder.productDetails.forEach((product) => {
        if (product.isWarrantyClaim) {
          newWarrantyAmount += product.total;
        } else {
          newSubtotal += product.total;
        }
      });

      updatedDoc.productDetails = findOrder.productDetails;
    } else {
      newSubtotal = Number(findOrder.subtotal || 0);
      newWarrantyAmount = Number(findOrder.warrantyAmount || 0);
    }
    updatedDoc.subtotal = newSubtotal;
    updatedDoc.warrantyAmount = newWarrantyAmount;
    // Update shipping chare
    if (payload?.shippingCharge) {
      const shippingMethod = await ShippingCharge.findById(
        payload.shippingCharge
      );
      if (!shippingMethod) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Failed to find shipping charge"
        );
      }
      updatedDoc.shippingCharge = shippingMethod?._id;
      increments += Number(shippingMethod?.amount || 0);
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
    updatedDoc.division = division;
    updatedDoc.district = district;

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
const deleteOrdersByIdFromBD = async (orderIds: string[]) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    for (const orderId of orderIds) {
      const order = await Order.findOne({ _id: orderId });
      if (order) {
        // update quantity
        for (const item of order.productDetails) {
          const product = await ProductModel.findById(item.product, {
            inventory: 1,
            title: 1,
          }).lean();
          await InventoryModel.updateOne(
            { _id: product?.inventory },
            { $inc: { stockAvailable: item.quantity } }
          ).session(session);
        }
        order.isDeleted = true;
        order.status = "deleted";
        await order.save({ session });
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
              Get orders counts
-------------------------------------------- */
const orderCountsByStatusFromBD = async () => {
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
          Update order delivery status
-------------------------------------------- */
const updateOrdersDeliveryStatusIntoDB = async () => {
  await updateCourierStatus();
};

/* -----------------------------------------
        Get a customers orders counts
-------------------------------------------- */
const getCustomersOrdersCountByPhoneFromDB = async (phoneNumber: string) => {
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
    "On courier": 0,
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
        },
        parcelTrackingLink: {
          $cond: {
            if: { $eq: ["$courierDetailsData.slug", "steedfast"] },
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
  const updatedStatusHistory = result.statusHistory.map(
    ({ status, createdAt }: { status: TOrderStatus; createdAt: string }) => {
      const currentStatusDesc = orderStatusWithDesc.find(
        (item) => item.status === status
      );
      return {
        status,
        description: currentStatusDesc?.description,
        createdAt,
      };
    }
  );
  result.statusHistory = updatedStatusHistory;
  return result;
};

/* -----------------------------------------
    Manage return and partial return orders
-------------------------------------------- */
const returnAndPartialManagementIntoDB = async (
  orderIds: mongoose.Types.ObjectId[],
  status: Partial<TOrderStatus>,
  user: TJwtPayload
) => {
  const changeableStatus: Partial<TOrderStatus[]> = ["On courier"];
  const acceptableStatus = ["partial completed", "returned"];
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
          updateStockOrderCancelDelete(order.productDetails, session),
          deleteWarrantyFromOrder(order.productDetails, order._id, session),
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

const getMobileNumbersForSendingSMSFromDB = async (
  query: Record<string, unknown>
) => {
  let matchQuery: Record<string, unknown> = {};

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
    },
  ];

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
    const ids = Array.isArray(query.productIds)
      ? query.productIds
      : [query.productIds];

    matchQuery = {
      ...matchQuery,
      "productDetails.product": {
        $in: ids.map((id) => new Types.ObjectId(id)),
      },
    };
  }

  if (query.status) {
    const statuses = Array.isArray(query.status)
      ? query.status
      : [query.status];

    matchQuery = {
      ...matchQuery,
      status: {
        $in: statuses,
      },
    };
  }

  if (query.district) {
    matchQuery = {
      ...matchQuery,
      district: query.district,
    };
  }

  if (query.division) {
    matchQuery = {
      ...matchQuery,
      division: query.division,
    };
  }

  pipeline.unshift({
    $match: matchQuery,
  });

  const result = (await Order.aggregate(pipeline))[0];

  return result;
};

export const OrderServices = {
  createOrderIntoDB,
  updateOrderStatusIntoDB,
  updateProcessingStatusIntoDB,
  bookCourierAndUpdateStatusIntoDB,
  getAllOrdersCustomerFromDB,
  getOrderInfoByOrderIdCustomerFromDB,
  getOrderInfoByOrderIdAdminFromDB,
  getAllOrdersAdminFromDB,
  getCompletedOrdersAdminFromDB,
  updateOrderDetailsByAdminIntoDB,
  deleteOrdersByIdFromBD,
  orderCountsByStatusFromBD,
  updateOrdersDeliveryStatusIntoDB,
  getProcessingOrdersAdminFromDB,
  getProcessingDoneCourierOrdersAdminFromDB,
  getCustomersOrdersCountByPhoneFromDB,
  getOrderTrackingInfo,
  getOrdersByDeliveryStatusFromDB,
  returnAndPartialManagementIntoDB,
  getMobileNumbersForSendingSMSFromDB,
};
