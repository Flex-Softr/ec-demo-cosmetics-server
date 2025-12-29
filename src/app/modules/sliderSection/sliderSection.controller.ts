import { Request, Response } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import catchAsync from "../../utilities/catchAsync";
import { SliderSectionService } from "./sliderSection.service";

// Create Slider Section
const createSliderSection = catchAsync(async (req: Request, res: Response) => {
  const createdBy = req.user.id as Types.ObjectId;

  // Assuming req.user contains the authenticated user
  const result = await SliderSectionService.createSliderSection(
    createdBy,
    req.body
  );
  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Slider section created successfully!",
    data: result,
  });
});

// Get Slider Sections (with query parameter filtering for isActive)
const getSliderSections = catchAsync(async (req: Request, res: Response) => {
  const result = await SliderSectionService.getSliderSections(req.query);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
});

// Update Slider Section
const updateSliderSection = catchAsync(async (req: Request, res: Response) => {
  const updatedBy = req.user.id as Types.ObjectId; // Assuming req.user contains the authenticated user
  const { id } = req.params;
  const result = await SliderSectionService.updateSliderSection(
    updatedBy,
    id,
    req.body
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Slider section updated successfully!",
    data: result,
  });
});

// Delete Slider Section
const deleteSliderSection = catchAsync(async (req: Request, res: Response) => {
  const deletedBy = req.user.id as Types.ObjectId; // Assuming req.user contains the authenticated user
  const { sliderSectionIds } = req.body; // Assuming IDs are sent in the body
  const result = await SliderSectionService.deleteSliderSection(
    deletedBy,
    sliderSectionIds
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Slider section deleted successfully!",
    data: result,
  });
});

export const SliderSectionController = {
  createSliderSection,
  getSliderSections,
  updateSliderSection,
  deleteSliderSection,
};
