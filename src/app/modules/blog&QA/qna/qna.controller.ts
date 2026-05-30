import { Request, Response } from "express";
import httpStatus from "http-status";
import { QnAService } from "./qna.service";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";

const createQnA = catchAsync(async (req: Request, res: Response) => {
  const result = await QnAService.createQnA(req.body);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Q&A created successfully",
    data: result,
  });
});

const getAllQnAs = catchAsync(async (req: Request, res: Response) => {
  const result = await QnAService.getAllQnAs(req.query);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Q&As retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getQnAById = catchAsync(async (req: Request, res: Response) => {
  const result = await QnAService.getQnAById(req.params.id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Q&A retrieved successfully",
    data: result,
  });
});

const getQnABySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await QnAService.getQnABySlug(req.params.slug);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Q&A retrieved successfully",
    data: result,
  });
});

const incrementQnAViews = catchAsync(async (req: Request, res: Response) => {
  const result = await QnAService.incrementQnAViews(req.params.id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Q&A views updated",
    data: result,
  });
});

const updateQnA = catchAsync(async (req: Request, res: Response) => {
  const result = await QnAService.updateQnA(req.params.id, req.body);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Q&A updated successfully",
    data: result,
  });
});

const deleteQnA = catchAsync(async (req: Request, res: Response) => {
  await QnAService.deleteQnA(req.params.id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Q&A deleted successfully",
    data: null,
  });
});

export const QnAController = {
  createQnA,
  getAllQnAs,
  getQnAById,
  getQnABySlug,
  incrementQnAViews,
  updateQnA,
  deleteQnA,
};
