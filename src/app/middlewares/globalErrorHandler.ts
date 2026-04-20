import { ErrorRequestHandler } from "express";
import fsEx from "fs-extra";
import multer from "multer";
import path from "path";
import { ZodError } from "zod";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";
import handleApiError from "../errorHandlers/handleApiError";
import handleJodError from "../errorHandlers/handleJodError";
import handleMongooseCastError from "../errorHandlers/handleMongooseCastError";
import handleMongooseDuplicateError from "../errorHandlers/handleMongooseDuplicateError";
import handleMongooseValidationError from "../errorHandlers/handleMongooseValidationError";
import { TErrorMessages, TIErrorResponse } from "../types/error";
import { errorLogger } from "../utilities/logger";

const globalErrorhandler: ErrorRequestHandler = async (
  err,
  req,
  res,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next
) => {
  let statusCode = 500;
  let message =
    "Something went wrong. Please try again later or contact to the support";

  if (config.env === "development") {
    // eslint-disable-next-line no-console
    console.log(err);
  }

  // Always log the error to the persistent error logger
  errorLogger.error(`❌ Error in ${req.method} ${req.originalUrl}`, err);

  // File cleanup logic: if an error occurs, delete any uploaded files/folders
  const files = req.files as Express.Multer.File[] | undefined;
  const file = req.file as Express.Multer.File | undefined;
  const uploadedFolders = req.uploadedFolders;

  const foldersToDelete = new Set<string>();

  // 1. Add folders tracked during destination assignment (handles errors mid-upload)
  if (uploadedFolders) {
    uploadedFolders.forEach((folder) => foldersToDelete.add(folder));
  }

  // 2. Add folders from successfully uploaded files (fallback)
  const uploadedFiles = [];
  if (file) uploadedFiles.push(file);
  if (files && Array.isArray(files)) uploadedFiles.push(...files);
  if (files && !Array.isArray(files) && typeof files === "object") {
    Object.values(files).forEach((fileArray) => {
      uploadedFiles.push(...(fileArray as Express.Multer.File[]));
    });
  }

  uploadedFiles.forEach((f) => {
    if (f.path) {
      foldersToDelete.add(path.dirname(f.path));
    }
  });

  // Execute cleanup
  if (foldersToDelete.size > 0) {
    for (const folder of foldersToDelete) {
      try {
        if (await fsEx.pathExists(folder)) {
          await fsEx.remove(folder);
        }
      } catch (cleanupError) {
        errorLogger.error("Failed to cleanup uploaded folder:", cleanupError);
      }
    }
  }

  let errorMessages: TErrorMessages[] = [{ path: "", message }];
  if (err.name === "ValidationError") {
    const modifiedError: TIErrorResponse = handleMongooseValidationError(err);
    message = modifiedError.message;
    statusCode = modifiedError.statusCode;
    errorMessages = modifiedError.errorMessages;
  } else if (err.name === "CastError" || err.name === "BSONError") {
    const modifiedError: TIErrorResponse = handleMongooseCastError(err);
    message = modifiedError.message;
    statusCode = modifiedError.statusCode;
    errorMessages = modifiedError.errorMessages;
  } else if (
    (err.name === "MongoServerError" || err.name === "MongoBulkWriteError") &&
    err.code === 11000
  ) {
    const modifiedError: TIErrorResponse = handleMongooseDuplicateError(err);
    message = modifiedError.message;
    statusCode = modifiedError.statusCode;
    errorMessages = modifiedError.errorMessages;
  } else if (err instanceof ZodError) {
    const modifiedError: TIErrorResponse = handleJodError(err);
    message = modifiedError.message;
    statusCode = modifiedError.statusCode;
    errorMessages = modifiedError.errorMessages;
  } else if (err instanceof ApiError) {
    const modifiedError: TIErrorResponse = handleApiError(err);
    message = modifiedError.message;
    statusCode = modifiedError.statusCode;
    errorMessages = modifiedError.errorMessages;
  } else if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large. Maximum size is 1MB.";
        break;
      case "LIMIT_FILE_COUNT":
        message = `Too many files. Maximum ${config.upload_image_maxCount} number of files is exceeded.`;
        break;
      case "LIMIT_FIELD_KEY":
        message = "Field name is too long.";
        break;
      case "LIMIT_FIELD_VALUE":
        message = "Field value is too large.";
        break;
      case "LIMIT_FIELD_COUNT":
        message = "Too many fields.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field.";
        break;
      case "LIMIT_PART_COUNT":
        message = "Too many parts.";
        break;
      default:
        message = "An unknown error occurred during file upload.";
        break;
    }
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env === "development" ? err.stack : undefined,
  });
};

export default globalErrorhandler;
