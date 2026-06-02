import { PipelineStage, Types } from "mongoose";
import { TBannerSlider } from "./bannerSlider.interface";
import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import { BannerSliderModel } from "./bannerSlider.model";

// Create Banner Slider
const createBannerSlider = async (
  createdBy: Types.ObjectId,
  payload: TBannerSlider
) => {
  payload.createdBy = createdBy;
  payload.isActive = payload.isActive ?? true; // Default to true if not provided
  const result = await BannerSliderModel.create(payload);
  return result;
};

// Get Banner Sliders with optional filtering by isActive
const getBannerSliders = async (query?: Record<string, unknown>) => {
  const matchStage: Record<string, unknown> = {
    isDeleted: { $ne: true },
  }; // Base match condition

  // If isActive is provided, add it to the match conditions
  if (query?.isActive) {
    matchStage.isActive = query.isActive === "true";
  }

  const pipeline: PipelineStage[] = [
    { $match: matchStage }, // Apply the match stage with filtering conditions
    {
      $lookup: {
        from: "images", // Lookup the images collection
        localField: "image", // Match the local 'image' field
        foreignField: "_id", // Match the foreign '_id' field
        as: "image", // Output results in 'image' field
      },
    },
    {
      $unwind: {
        path: "$image",
        preserveNullAndEmptyArrays: true, // If there's no image, retain the document
      },
    },
    {
      $project: {
        // Project the necessary fields
        _id: 1,
        name: 1,
        image: {
          _id: "$image._id",
          src: "$image.src",
          alt: "$image.alt",
        },
        bannerLink: 1,
        sortOrder: 1,
        isActive: 1, // Include the isActive field
      },
    },
    { $sort: { sortOrder: 1 } },
  ];

  const result = await BannerSliderModel.aggregate(pipeline);
  return result;
};

// Update Banner Slider
const updateBannerSlider = async (
  updatedBy: Types.ObjectId,
  id: string,
  payload: TBannerSlider
) => {
  payload.updatedBy = updatedBy;
  const isBannerSliderExist = await BannerSliderModel.findById(id);

  if (!isBannerSliderExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Banner slider not found!");
  }

  const result = await BannerSliderModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

// Delete Banner Slider
const deleteBannerSlider = async (
  deletedBy: Types.ObjectId,
  bannerSliderIds: string[]
) => {
  const result = await BannerSliderModel.deleteMany({
    _id: { $in: bannerSliderIds },
  });

  return result;
};

export const BannerSliderService = {
  createBannerSlider,
  getBannerSliders,
  updateBannerSlider,
  deleteBannerSlider,
};
