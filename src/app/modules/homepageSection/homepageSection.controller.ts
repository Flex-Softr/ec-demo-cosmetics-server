import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { HomepageSectionService } from "./homepageSection.service";

const createHomepageSection = catchAsync(
  async (req: Request, res: Response) => {
    const result = await HomepageSectionService.createHomepageSection(req.body);

    successResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Homepage Section created successfully!",
      data: result,
    });
  }
);

const getAllHomepageSections = catchAsync(
  async (req: Request, res: Response) => {
    const result = await HomepageSectionService.getAllHomepageSections();

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Homepage Sections retrieved successfully!",
      data: result,
    });
  }
);

const getHomepageSectionById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await HomepageSectionService.getHomepageSectionById(id);

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Homepage Section retrieved successfully!",
      data: result,
    });
  }
);

const updateHomepageSection = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await HomepageSectionService.updateHomepageSection(
      id,
      req.body
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Homepage Section updated successfully!",
      data: result,
    });
  }
);

const deleteHomepageSection = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await HomepageSectionService.deleteHomepageSection(id);

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Homepage Section deleted successfully!",
      data: result,
    });
  }
);

const getHomepageSectionContent = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, meta } =
      await HomepageSectionService.getHomepageSectionContent(id);

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Homepage Section Content retrieved successfully!",
      data,
      meta,
    });
  }
);

export const HomepageSectionController = {
  createHomepageSection,
  getAllHomepageSections,
  getHomepageSectionById,
  updateHomepageSection,
  deleteHomepageSection,
  getHomepageSectionContent,
};
