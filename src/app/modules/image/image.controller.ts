import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "../../config/config";
import { r2Client } from "../../config/r2.config";
import { ImageServices } from "./image.service";

const generatePresignedUrl = catchAsync(async (req, res) => {
  const { filename, contentType, purpose, refId } = req.body;
  if (!filename || !contentType) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Filename and contentType are required"
    );
  }

  // Create an SEO-friendly unique key for the file
  const timestamp = Date.now();
  const idPath = refId ? `/${refId}` : `/${timestamp}`;

  let folder = `general${idPath}`;
  if (purpose === "product") {
    folder = `products${idPath}`;
  } else if (purpose === "blog") {
    folder = `blogs${idPath}`;
  }

  const fileExt = filename.split(".").pop()?.toLowerCase() || "";
  const baseName = filename
    .replace(new RegExp(`\\.${fileExt}$`, "i"), "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const key = `${folder}/${baseName ? baseName + "." : ""}${fileExt}`;

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: key,
    ContentType: contentType,
  });

  // URL expires in 5 minutes (300 seconds)
  const presignedUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 300,
  });
  const publicUrl = `${config.r2.publicDomain}/${key}`;

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Presigned URL generated successfully",
    data: { presignedUrl, key, url: publicUrl },
  });
});

const createImage = catchAsync(async (req, res) => {
  const uploadedBy = req.user.id || req.user._id;

  if (!uploadedBy) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "User not authorized or ID missing"
    );
  }

  const payloadImages = req.body.images as {
    src: string;
    alt: string;
    purpose?: "product" | "blog" | "general";
  }[];
  if (!payloadImages || payloadImages.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Images data is required");
  }

  const images = payloadImages.map((img) => {
    return {
      src: img.src,
      alt: img.alt,
      purpose: img.purpose ?? "general",
      uploadedBy,
    };
  });
  const result = await ImageServices.createImageIntoDB(images);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Image created successfully!",
    data: result,
  });
});

const getAllImages = catchAsync(async (req, res) => {
  const { meta, data } = await ImageServices.getAllImagesFromDB(req.query);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All images retrieved successfully!",
    meta: meta,
    data: data,
  });
});

const getAnImage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ImageServices.getAnImageFromDB(id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "An image retrieved successfully!",
    data: result,
  });
});

const deleteImages = catchAsync(async (req, res) => {
  const deletedBy = req.user.id;
  const { imageIds } = req.body;
  await ImageServices.deleteImagesFromDB(deletedBy, imageIds);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Images deleted successfully!",
    data: null,
  });
});

export const ImageControllers = {
  generatePresignedUrl,
  createImage,
  getAnImage,
  getAllImages,
  deleteImages,
};
