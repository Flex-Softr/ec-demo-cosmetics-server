import { Request, Response } from "express";
import httpStatus from "http-status";
import { BlogPostService } from "./blogPost.service";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";

const createBlogPost = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogPostService.createBlogPost(req.body);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog post created successfully",
    data: result,
  });
});

const getAllBlogPosts = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogPostService.getAllBlogPosts(req.query);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog posts retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getBlogPostById = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogPostService.getBlogPostById(req.params.id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog post retrieved successfully",
    data: result,
  });
});

const getBlogPostBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogPostService.getBlogPostBySlug(req.params.slug);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog post retrieved successfully",
    data: result,
  });
});

const incrementBlogPostViews = catchAsync(
  async (req: Request, res: Response) => {
    const result = await BlogPostService.incrementBlogPostViews(req.params.id);

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog post views updated",
      data: result,
    });
  }
);

const updateBlogPost = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogPostService.updateBlogPost(req.params.id, req.body);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog post updated successfully",
    data: result,
  });
});

const deleteBlogPost = catchAsync(async (req: Request, res: Response) => {
  await BlogPostService.deleteBlogPost(req.params.id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog post deleted successfully",
    data: null,
  });
});

export const BlogPostController = {
  createBlogPost,
  getAllBlogPosts,
  getBlogPostById,
  getBlogPostBySlug,
  incrementBlogPostViews,
  updateBlogPost,
  deleteBlogPost,
};
