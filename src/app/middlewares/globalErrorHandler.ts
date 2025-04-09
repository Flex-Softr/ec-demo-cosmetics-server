import { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";
import handleApiError from "../errorHandlers/handleApiError";
import handleJodError from "../errorHandlers/handleJodError";
import handleMongooseCastError from "../errorHandlers/handleMongooseCastError";
import handleMongooseDuplicateError from "../errorHandlers/handleMongooseDuplicateError";
import handleMongooseValidationError from "../errorHandlers/handleMongooseValidationError";
import { TErrorMessages, TIErrorResponse } from "../types/error";
import { consoleLogger } from "../utilities/logger";

/**
 * The function `globalErrorhandler` handles various types of errors and sends a formatted response
 * with appropriate status code and error message.
 * @param err - The `err` parameter in the `globalErrorhandler` function represents the error object
 * that is passed to the error handling middleware in an Express application. This object contains
 * information about the error that occurred during the request processing. Depending on the type of
 * error, different actions are taken within the error handler to
 * @param req - The `req` parameter in the `globalErrorhandler` function represents the HTTP request
 * object, which contains information about the incoming request such as headers, parameters, body,
 * etc. It is used to access and manipulate the request data within the error handling middleware.
 * @param res - The `res` parameter in the `globalErrorhandler` function is the response object in
 * Express.js. It is used to send a response back to the client making the request. In the provided
 * code snippet, `res` is used to set the HTTP status code, send a JSON response with error
 * @param next - The `next` parameter in the `globalErrorhandler` function is a callback function that
 * is used to pass control to the next middleware function in the stack. It is typically used in
 * Express.js middleware functions to pass an error to the next error-handling middleware. If an error
 * occurs in the current
 */
const globalErrorhandler: ErrorRequestHandler = (
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
    consoleLogger.error(err);
  }

  if (config.log_error === "true") {
    // eslint-disable-next-line no-console
    console.error(`❌ Error happened in ${req.method} ${req.originalUrl}`, err);
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
  } else if (err.name === "MongoServerError" && err.code === 11000) {
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
