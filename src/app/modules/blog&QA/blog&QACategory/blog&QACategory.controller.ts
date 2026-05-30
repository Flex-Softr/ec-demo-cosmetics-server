import { Request, Response } from "express";
import httpStatus from "http-status";
import { BlogQAcategoryService } from "./blog&QACategory.service";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";

const createBlogQAcategory = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQAcategoryService.createBlogQAcategory(req.body);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog category created successfully",
    data: result,
  });
});

const getAllBlogQAcategories = catchAsync(
  async (req: Request, res: Response) => {
    const result = await BlogQAcategoryService.getAllBlogQAcategories(
      req.query
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog categories retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

const getBlogQAcategoryById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await BlogQAcategoryService.getBlogQAcategoryById(
      req.params.id
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog category retrieved successfully",
      data: result,
    });
  }
);

const getBlogQAcategoryBySlug = catchAsync(
  async (req: Request, res: Response) => {
    const result = await BlogQAcategoryService.getBlogQAcategoryBySlug(
      req.params.slug
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog category retrieved successfully",
      data: result,
    });
  }
);

const updateBlogQAcategory = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogQAcategoryService.updateBlogQAcategory(
    req.params.id,
    req.body
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog category updated successfully",
    data: result,
  });
});

const deleteBlogQAcategory = catchAsync(async (req: Request, res: Response) => {
  await BlogQAcategoryService.deleteBlogQAcategory(req.params.id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog category deleted successfully",
    data: null,
  });
});

export const BlogQAcategoryController = {
  createBlogQAcategory,
  getAllBlogQAcategories,
  getBlogQAcategoryById,
  getBlogQAcategoryBySlug,
  updateBlogQAcategory,
  deleteBlogQAcategory,
};
