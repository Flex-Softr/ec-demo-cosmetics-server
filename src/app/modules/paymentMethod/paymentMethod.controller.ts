import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { TJwtPayload } from "../authManagement/auth/auth.interface";
import { TPaymentMethod } from "./paymentMethod.interface";
import { PaymentMethodService } from "./paymentMethod.service";

const getPaymentMethods = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentMethodService.getAllPaymentMethodsFromDB();
  successResponse<TPaymentMethod[]>(res, {
    statusCode: httpStatus.OK,
    message: "Payment methods retrieved successfully.",
    data: result,
  });
});

const createPaymentMethod = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentMethodService.createPaymentMethod(
    req.body,
    req.user as TJwtPayload
  );
  successResponse<TPaymentMethod>(res, {
    statusCode: httpStatus.CREATED,
    message: "Payment method created successfully.",
    data: result,
  });
});

const updatePaymentMethod = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PaymentMethodService.updatePaymentMethodIntoDB(
    id,
    req.body
  );
  successResponse<TPaymentMethod | null>(res, {
    statusCode: httpStatus.OK,
    message: "Payment method updated successfully.",
    data: result,
  });
});

const deletePaymentMethod = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PaymentMethodService.deletePaymentMethodFromDB(id);
  successResponse<TPaymentMethod | null>(res, {
    statusCode: httpStatus.OK,
    message: "Payment method deleted successfully.",
    data: result,
  });
});

export const PaymentMethodController = {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
