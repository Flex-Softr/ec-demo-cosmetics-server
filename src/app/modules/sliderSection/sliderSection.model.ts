import httpStatus from "http-status";
import { Schema, model } from "mongoose";
import ApiError from "../../errorHandlers/ApiError";
import { ImageModel } from "../image/image.model";
import { TSliderSection } from "./sliderSection.interface";

// Define the schema for the slider section
const sliderSectionSchema = new Schema<TSliderSection>(
  {
    name: { type: String, required: true, unique: true }, // Name of the slider section, must be unique
    image: { type: Schema.Types.ObjectId, ref: "Image", required: true }, // Reference to the image object
    bannerLink: { type: String }, // Link associated with the slider
    isActive: { type: Boolean, default: true }, // Status to check if the slider section is active or inactive

    // User relations
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Middleware before saving to validate name format and image reference
sliderSectionSchema.pre("save", async function (next) {
  // Trim and capitalize the name field
  if (this.name) {
    this.name = this.name
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .trim() // Remove leading/trailing spaces
      .toLowerCase() // Convert the entire string to lowercase
      .split(" ") // Split the string into an array of words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
      .join(" "); // Join the array of words back into a single string
  }

  // Validate if the image exists and is not deleted
  if (this.image) {
    const isImageExist = await ImageModel.findById(this.image);
    if (!isImageExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "The image was not found!");
    }
    if (isImageExist.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, "The image is deleted!");
    }
  }

  next(); // Move to the next middleware
});

export const SliderSectionModel = model<TSliderSection>(
  "SliderSection",
  sliderSectionSchema
);
