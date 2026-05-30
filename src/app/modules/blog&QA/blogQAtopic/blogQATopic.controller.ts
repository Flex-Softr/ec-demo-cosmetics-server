import { Request, Response } from "express";
import httpStatus from "http-status";
import { BlogQATopicService } from "./blogQATopic.service";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";

const createBlogQATopic = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQATopicService.createBlogQATopic(req.body);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog QA topic created successfully",
    data: result,
  });
});

const getAllBlogQATopics = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQATopicService.getAllBlogQATopics(req.query);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog QA topics retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getBlogQATopicById = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQATopicService.getBlogQATopicById(req.params.id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog QA topic retrieved successfully",
    data: result,
  });
});

const getBlogQATopicBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQATopicService.getBlogQATopicBySlug(req.params.slug);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog QA topic retrieved successfully",
    data: result,
  });
});

const updateBlogQATopic = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQATopicService.updateBlogQATopic(
    req.params.id,
    req.body
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog QA topic updated successfully",
    data: result,
  });
});

const deleteBlogQATopic = catchAsync(async (req: Request, res: Response) => {
  await BlogQATopicService.deleteBlogQATopic(req.params.id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog QA topic deleted successfully",
    data: null,
  });
});

export const BlogQATopicController = {
  createBlogQATopic,
  getAllBlogQATopics,
  getBlogQATopicById,
  getBlogQATopicBySlug,
  updateBlogQATopic,
  deleteBlogQATopic,
};
