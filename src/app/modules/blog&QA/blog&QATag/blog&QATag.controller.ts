import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { BlogQATagService } from "./blog&QATag.service";

const createBlogQATag = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQATagService.createBlogQATag(req.body);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog QA tag created successfully",
    data: result,
  });
});

const getAllBlogQATags = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQATagService.getAllBlogQATags(req.query);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog QA tags retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getBlogQATagById = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQATagService.getBlogQATagById(req.params.id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog QA tag retrieved successfully",
    data: result,
  });
});

const getBlogQATagBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQATagService.getBlogQATagBySlug(req.params.slug);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog QA tag retrieved successfully",
    data: result,
  });
});

const updateBlogQATag = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQATagService.updateBlogQATag(
    req.params.id,
    req.body
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog QA tag updated successfully",
    data: result,
  });
});

const deleteBlogQATag = catchAsync(async (req: Request, res: Response) => {
  await BlogQATagService.deleteBlogQATag(req.params.id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog QA tag deleted successfully",
    data: null,
  });
});

export const BlogQATagController = {
  createBlogQATag,
  getAllBlogQATags,
  getBlogQATagById,
  getBlogQATagBySlug,
  updateBlogQATag,
  deleteBlogQATag,
};
