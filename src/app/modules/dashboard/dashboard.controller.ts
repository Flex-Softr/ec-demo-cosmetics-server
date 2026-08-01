import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { TOrderReportFilter } from "./dashboard.interface";
import { DashboardServices } from "./dashboard.service";

const getStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.getStatsFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Dashboard stats retrieved successfully.",
    data: result,
  });
});

const getOrderStatus = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.getOrderStatusFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order status report retrieved successfully.",
    data: result,
  });
});

const getShippingStatus = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.getShippingStatusFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Shipping status report retrieved successfully.",
    data: result,
  });
});

const getOrdersSummary = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.getOrdersSummaryFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Orders summary retrieved successfully.",
    data: result,
  });
});

const getOrderReport = catchAsync(async (req: Request, res: Response) => {
  const filter = (req.query.filter as TOrderReportFilter) || "monthly";
  const result = await DashboardServices.getOrderReportFromDB(filter);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order report retrieved successfully.",
    data: result,
  });
});

const getTopCustomers = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.getTopCustomersFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Top customers retrieved successfully.",
    data: result,
  });
});

const getRecentOrders = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.getRecentOrdersFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Recent orders retrieved successfully.",
    data: result,
  });
});

export const DashboardController = {
  getStats,
  getOrderStatus,
  getShippingStatus,
  getOrdersSummary,
  getOrderReport,
  getTopCustomers,
  getRecentOrders,
};
