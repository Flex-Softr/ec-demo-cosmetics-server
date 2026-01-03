import { Types } from "mongoose";
import { TSliderSection } from "./sliderSection.interface";

import httpStatus from "http-status";
import config from "../../config/config";
import ApiError from "../../errorHandlers/ApiError";
import { SliderSectionModel } from "./sliderSection.model";

// Create Slider Section
const createSliderSection = async (
  createdBy: Types.ObjectId,
  payload: TSliderSection
) => {
  payload.createdBy = createdBy;
  payload.isActive = payload.isActive ?? true; // Default to true if not provided

  const existingSliderSection = await SliderSectionModel.findOne({
    name: { $regex: new RegExp(payload.name, "i") },
  });

  if (existingSliderSection) {
    const result = await SliderSectionModel.findByIdAndUpdate(
      existingSliderSection._id,
      payload,
      { new: true }
    );
    return result;
  } else {
    const result = await SliderSectionModel.create(payload);
    return result;
  }
};

// Get Slider Sections with optional filtering by isActive
const getSliderSections = async (query?: Record<string, unknown>) => {
  const matchStage: Record<string, unknown> = {
    isDeleted: { $ne: true },
  }; // Base match condition

  // If isActive is provided, add it to the match conditions
  if (query?.isActive) {
    matchStage.isActive = query.isActive === "true";
  }

  const pipeline = [
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
          src: { $concat: [config.image_base_url, "/", "$image.src"] },
          alt: "$image.alt",
        },
        bannerLink: 1,
        isActive: 1, // Include the isActive field
      },
    },
  ];

  const result = await SliderSectionModel.aggregate(pipeline);
  return result;
};

// Update Slider Section
const updateSliderSection = async (
  updatedBy: Types.ObjectId,
  id: string,
  payload: TSliderSection
) => {
  payload.updatedBy = updatedBy;
  const isSliderSectionExist = await SliderSectionModel.findById(id);

  if (!isSliderSectionExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Slider section not found!");
  }

  const result = await SliderSectionModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

// Delete Slider Section
const deleteSliderSection = async (
  deletedBy: Types.ObjectId,
  sliderSectionIds: string[]
) => {
  const result = await SliderSectionModel.deleteMany({
    _id: { $in: sliderSectionIds },
  });

  return result;
};

export const SliderSectionService = {
  createSliderSection,
  getSliderSections,
  updateSliderSection,
  deleteSliderSection,
};
