import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "../../config/config";
import { r2Client } from "../../config/r2.config";
import { BookPreviewServices } from "./bookPreview.service";

const generatePresignedUrl = catchAsync(async (req, res) => {
  const { filename, contentType, previewType, bookId } = req.body;
  if (!filename || !contentType) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Filename and contentType are required"
    );
  }

  // Create an SEO-friendly unique key for the file
  const timestamp = Date.now();
  const idPath = bookId ? `/${bookId}` : `/${timestamp}`;

  let folder = `books${idPath}`; // fallback
  if (previewType === "free") {
    folder = `free-books${idPath}`;
  } else if (previewType === "short" || previewType === "full") {
    folder = `preview-books${idPath}`;
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

  // URL expires in 5 minutes
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

const createBookPreview = catchAsync(async (req, res) => {
  const uploadedBy = req.user.id || req.user._id;

  if (!uploadedBy) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "User not authorized or ID missing"
    );
  }

  const payloadPreviews = req.body.previews as {
    src: string;
    alt: string;
    previewType?: "short" | "full" | "free";
  }[];
  if (!payloadPreviews || payloadPreviews.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Previews data is required");
  }

  const previews = payloadPreviews.map((preview) => {
    return {
      src: preview.src,
      alt: preview.alt,
      previewType: preview.previewType || "short",
      uploadedBy,
      isDeleted: false,
    };
  });

  const result = await BookPreviewServices.createBookPreviewIntoDB(previews);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Book preview created successfully!",
    data: result,
  });
});

const getAllBookPreviews = catchAsync(async (req, res) => {
  const { meta, data } = await BookPreviewServices.getAllBookPreviewsFromDB(
    req.query
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All book previews retrieved successfully!",
    meta: meta,
    data: data,
  });
});

const getABookPreview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BookPreviewServices.getABookPreviewFromDB(id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "A book preview retrieved successfully!",
    data: result,
  });
});

const deleteBookPreviews = catchAsync(async (req, res) => {
  const deletedBy = req.user.id;
  const { previewIds } = req.body;
  await BookPreviewServices.deleteBookPreviewsFromDB(deletedBy, previewIds);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Book previews deleted successfully!",
    data: null,
  });
});

export const BookPreviewControllers = {
  generatePresignedUrl,
  createBookPreview,
  getABookPreview,
  getAllBookPreviews,
  deleteBookPreviews,
};
