import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import {
  TSalesByCategoryQuery,
  TSalesByProductQuery,
  TSalesDateFilters,
  TSalesOrdersQuery,
  TSalesPaymentsQuery,
} from "./sales.interface";
import { SalesServices } from "./sales.service";

const getSalesSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await SalesServices.getSalesSummaryFromDB(
    req.query as TSalesDateFilters
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Sales summary retrieved successfully.",
    data: result,
  });
});

const getSalesOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await SalesServices.getSalesOrdersFromDB(
    req.query as TSalesOrdersQuery
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order-wise sales report retrieved successfully.",
    meta: result.meta,
    data: result.data,
  });
});

const getSalesByProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await SalesServices.getSalesByProductFromDB(
    req.query as TSalesByProductQuery
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Sales by product retrieved successfully.",
    data: result,
  });
});

const getSalesByCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await SalesServices.getSalesByCategoryFromDB(
    req.query as TSalesByCategoryQuery
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Sales by category retrieved successfully.",
    data: result,
  });
});

const getSalesByPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await SalesServices.getSalesByPaymentsFromDB(
    req.query as TSalesPaymentsQuery
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Payment report retrieved successfully.",
    data: result,
  });
});

export const SalesController = {
  getSalesSummary,
  getSalesOrders,
  getSalesByProduct,
  getSalesByCategory,
  getSalesByPayments,
};
