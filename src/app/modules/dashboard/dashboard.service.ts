import moment from "moment-timezone";
import { PipelineStage } from "mongoose";
import { Order } from "../orderManagement/order/order.model";
import {
  orderDeliveryStatus,
  orderStatus,
} from "../orderManagement/order/order.const";
import ProductModel from "../productManagement/product/product.model";
import { PRODUCT_STATUS } from "../productManagement/product/product.const";
import { User } from "../userManagement/user/user.model";
import { ROLES } from "../userManagement/user/user.const";
import {
  TDashboardSummary,
  TOrderReportFilter,
  TOrderReportItem,
  TOrderStatusCount,
  TOrdersSummary,
  TRecentOrder,
  TTopCustomer,
} from "./dashboard.interface";

const TIME_ZONE = "Asia/Dhaka";
const EXCLUDED_STATUSES = ["canceled", "returned", "deleted"] as const;

const getStatsFromDB = async (): Promise<TDashboardSummary> => {
  const [orders, salesResult, products, customers] = await Promise.all([
    Order.countDocuments({
      status: { $nin: [...EXCLUDED_STATUSES] },
      isDeleted: { $ne: true },
    }),
    Order.aggregate<{ sales: number }>([
      {
        $match: {
          status: { $in: ["completed", "partial completed"] },
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          sales: {
            $sum: {
              $add: [{ $ifNull: ["$advance", 0] }, { $ifNull: ["$total", 0] }],
            },
          },
        },
      },
    ]),
    ProductModel.countDocuments({
      isDeleted: { $ne: true },
      publishedStatus: {
        $in: [PRODUCT_STATUS.PUBLISHED, PRODUCT_STATUS.DRAFT],
      },
    }),
    User.countDocuments({
      role: ROLES.CUSTOMER,
      status: "active",
    }),
  ]);

  return {
    orders,
    sales: salesResult[0]?.sales ?? 0,
    products,
    customers,
  };
};

const getOrderStatusFromDB = async (): Promise<TOrderStatusCount[]> => {
  const statuses = orderStatus.filter((s) => s !== "deleted");
  const statusMap: Record<string, number> = { all: 0 };
  statuses.forEach((status) => {
    statusMap[status] = 0;
  });

  const result = await Order.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        status: { $ne: "deleted" },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  result.forEach(({ _id, count }) => {
    if (_id in statusMap) {
      statusMap[_id] = count;
    }
    statusMap.all += count;
  });

  return Object.entries(statusMap).map(([status, count]) => ({
    status,
    status_formatted: status,
    count,
  }));
};

const getShippingStatusFromDB = async (): Promise<TOrderStatusCount[]> => {
  const statusMap: Record<string, number> = { all: 0 };
  orderDeliveryStatus.forEach((status) => {
    statusMap[status] = 0;
  });

  const result = await Order.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        status: { $ne: "deleted" },
        isDeleted: { $ne: true },
        deliveryStatus: { $exists: true, $nin: [null, ""] },
      },
    },
    {
      $group: {
        _id: "$deliveryStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  result.forEach(({ _id, count }) => {
    if (_id in statusMap) {
      statusMap[_id] = count;
    }
    statusMap.all += count;
  });

  return Object.entries(statusMap)
    .filter(([status, count]) => status === "all" || count > 0)
    .map(([status, count]) => ({
      status,
      status_formatted: status.replace(/_/g, " "),
      count,
    }));
};

const sumOrderValue = async (createdAtGte?: Date): Promise<number> => {
  const match: Record<string, unknown> = {
    status: { $nin: [...EXCLUDED_STATUSES] },
    isDeleted: { $ne: true },
  };

  if (createdAtGte) {
    match.createdAt = { $gte: createdAtGte };
  }

  const result = await Order.aggregate<{ total: number }>([
    { $match: match },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $add: [{ $ifNull: ["$advance", 0] }, { $ifNull: ["$total", 0] }],
          },
        },
      },
    },
  ]);

  return result[0]?.total ?? 0;
};

const getOrdersSummaryFromDB = async (): Promise<TOrdersSummary> => {
  const today = moment.tz(TIME_ZONE).startOf("day").toDate();
  const weekStart = moment.tz(TIME_ZONE).startOf("isoWeek").toDate();
  const monthStart = moment.tz(TIME_ZONE).startOf("month").toDate();

  const [todayValue, weekValue, monthValue, totalOrdersCount, totalValue] =
    await Promise.all([
      sumOrderValue(today),
      sumOrderValue(weekStart),
      sumOrderValue(monthStart),
      Order.countDocuments({
        status: { $nin: [...EXCLUDED_STATUSES] },
        isDeleted: { $ne: true },
      }),
      sumOrderValue(),
    ]);

  const avgOrderValue =
    totalOrdersCount > 0 ? totalValue / totalOrdersCount : 0;

  return {
    today_order_value: String(todayValue),
    week_order_value: String(weekValue),
    month_order_value: String(monthValue),
    total_orders_count: String(totalOrdersCount),
    avg_order_value: avgOrderValue.toFixed(2),
    total_order_value: String(totalValue),
  };
};

const getOrderReportRange = (filter: TOrderReportFilter) => {
  const now = moment.tz(TIME_ZONE);
  switch (filter) {
    case "daily":
      return {
        from: now.clone().subtract(30, "days").startOf("day").toDate(),
        format: "%b %d",
        groupId: {
          y: { $year: "$createdAt" },
          m: { $month: "$createdAt" },
          d: { $dayOfMonth: "$createdAt" },
        },
      };
    case "weekly":
      return {
        from: now.clone().subtract(12, "weeks").startOf("isoWeek").toDate(),
        format: "%G-W%V",
        groupId: {
          y: { $isoWeekYear: "$createdAt" },
          w: { $isoWeek: "$createdAt" },
        },
      };
    case "yearly":
      return {
        from: now.clone().subtract(5, "years").startOf("year").toDate(),
        format: "%Y",
        groupId: { y: { $year: "$createdAt" } },
      };
    case "monthly":
    default:
      return {
        from: now.clone().subtract(12, "months").startOf("month").toDate(),
        format: "%b %Y",
        groupId: {
          y: { $year: "$createdAt" },
          m: { $month: "$createdAt" },
        },
      };
  }
};

const getOrderReportFromDB = async (
  filter: TOrderReportFilter = "monthly"
): Promise<TOrderReportItem[]> => {
  const { from, format, groupId } = getOrderReportRange(filter);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        createdAt: { $gte: from },
        status: { $nin: [...EXCLUDED_STATUSES] },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: groupId,
        count: { $sum: 1 },
        firstDate: { $min: "$createdAt" },
      },
    },
    { $sort: { firstDate: 1 } },
    {
      $project: {
        _id: 0,
        date: {
          $dateToString: {
            format,
            date: "$firstDate",
            timezone: TIME_ZONE,
          },
        },
        count: 1,
      },
    },
  ];

  return Order.aggregate<TOrderReportItem>(pipeline);
};

const getTopCustomersFromDB = async (): Promise<TTopCustomer[]> => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        status: { $nin: [...EXCLUDED_STATUSES] },
        isDeleted: { $ne: true },
      },
    },
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
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $match: {
        "shippingInfo.phoneNumber": { $exists: true, $nin: [null, ""] },
      },
    },
    {
      $group: {
        _id: "$shippingInfo.phoneNumber",
        order_count: { $sum: 1 },
        name: { $first: "$shippingInfo.fullName" },
        phone: { $first: "$shippingInfo.phoneNumber" },
      },
    },
    { $sort: { order_count: -1 } },
    { $limit: 15 },
    {
      $project: {
        _id: 0,
        customer_id: "$_id",
        order_count: 1,
        customer: {
          name: "$name",
          phone: "$phone",
        },
      },
    },
  ];

  return Order.aggregate<TTopCustomer>(pipeline);
};

const getRecentOrdersFromDB = async (): Promise<TRecentOrder[]> => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        status: { $ne: "deleted" },
        isDeleted: { $ne: true },
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 15 },
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
      $project: {
        _id: 0,
        id: { $toString: "$_id" },
        invoice_no: "$orderId",
        status: 1,
        grand_total: {
          $add: [{ $ifNull: ["$advance", 0] }, { $ifNull: ["$total", 0] }],
        },
        customer_name: { $ifNull: ["$shippingInfo.fullName", null] },
        customer_phone: { $ifNull: ["$shippingInfo.phoneNumber", null] },
        created_at: "$createdAt",
      },
    },
  ];

  return Order.aggregate<TRecentOrder>(pipeline);
};

export const DashboardServices = {
  getStatsFromDB,
  getOrderStatusFromDB,
  getShippingStatusFromDB,
  getOrdersSummaryFromDB,
  getOrderReportFromDB,
  getTopCustomersFromDB,
  getRecentOrdersFromDB,
};
