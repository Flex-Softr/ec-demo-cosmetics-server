import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { BookPreviewServices } from "./bookPreview.service";

const createBookPreview = catchAsync(async (req, res) => {
  const uploadedBy = req.user.id || req.user._id;

  if (!uploadedBy) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "User not authorized or ID missing"
    );
  }

  const files = req.files as Express.Multer.File[];
  const previews = files?.map(({ path, originalname }: Express.Multer.File) => {
    const decodedName = Buffer.from(originalname, "latin1").toString("utf8");
    return { src: path, alt: decodedName, uploadedBy, isDeleted: false };
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
  createBookPreview,
  getABookPreview,
  getAllBookPreviews,
  deleteBookPreviews,
};
