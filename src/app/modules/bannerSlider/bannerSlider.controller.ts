import { Request, Response } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import catchAsync from "../../utilities/catchAsync";
import { BannerSliderService } from "./bannerSlider.service";

// Create Banner Slider
const createBannerSlider = catchAsync(async (req: Request, res: Response) => {
  const createdBy = req.user.id as Types.ObjectId;

  // Assuming req.user contains the authenticated user
  const result = await BannerSliderService.createBannerSlider(
    createdBy,
    req.body
  );
  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Banner slider created successfully!",
    data: result,
  });
});

// Get Banner Sliders (with query parameter filtering for isActive)
const getBannerSliders = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerSliderService.getBannerSliders(req.query);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
});

// Update Banner Slider
const updateBannerSlider = catchAsync(async (req: Request, res: Response) => {
  const updatedBy = req.user.id as Types.ObjectId; // Assuming req.user contains the authenticated user
  const { id } = req.params;
  const result = await BannerSliderService.updateBannerSlider(
    updatedBy,
    id,
    req.body
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Banner slider updated successfully!",
    data: result,
  });
});

// Delete Banner Slider
const deleteBannerSlider = catchAsync(async (req: Request, res: Response) => {
  const deletedBy = req.user.id as Types.ObjectId; // Assuming req.user contains the authenticated user
  const { bannerSliderIds } = req.body; // Assuming IDs are sent in the body
  const result = await BannerSliderService.deleteBannerSlider(
    deletedBy,
    bannerSliderIds
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Banner slider deleted successfully!",
    data: result,
  });
});

export const BannerSliderController = {
  createBannerSlider,
  getBannerSliders,
  updateBannerSlider,
  deleteBannerSlider,
};
