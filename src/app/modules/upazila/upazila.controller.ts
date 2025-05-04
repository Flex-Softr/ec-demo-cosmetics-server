import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { UpazilaService } from "./upazila.service";

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await UpazilaService.createIntoDB(req.body.upazilas);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "All upzila created successfully!",
    data,
  });
});

const getAllUpazilas = catchAsync(async (req: Request, res: Response) => {
  const data = await UpazilaService.getAllUpazilasFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All upzila retrieved successfully!",
    data,
  });
});

export const UpazilaController = {
  create,
  getAllUpazilas,
};
