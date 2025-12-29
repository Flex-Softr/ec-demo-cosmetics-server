import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import generateSlug from "../../utilities/generateSlug";
import successResponse from "../../utilities/successResponse";
import { CourierServices } from "./courier.service";

const createCourier = catchAsync(async (req: Request, res: Response) => {
  const { name, slug } = req.body;
  req.body.name = name.replace(/\s+/g, " ").trim();
  req.body.slug = generateSlug(name, slug);

  const result = await CourierServices.createCourierIntoDB(req.body);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Courier created successfully",
    data: result,
  });
});

const getAllCouriers = catchAsync(async (req: Request, res: Response) => {
  const result = await CourierServices.getAllCouriersFromDB(req.query);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Couriers retrieved successfully",
    data: result,
  });
});

const getSingleCourier = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourierServices.getCourierByIdFromDB(id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Courier retrieved successfully",
    data: result,
  });
});

const updateCourier = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug } = req.body;
  if (name) {
    req.body.name = name.replace(/\s+/g, " ").trim();
    req.body.slug = generateSlug(name, slug);
  }

  const result = await CourierServices.updateCourierIntoDB(id, req.body);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Courier updated successfully",
    data: result,
  });
});

const deleteCourier = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourierServices.deleteCourierFromDB(id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Courier deleted successfully",
    data: result,
  });
});

export const CourierController = {
  createCourier,
  getAllCouriers,
  getSingleCourier,
  updateCourier,
  deleteCourier,
};
