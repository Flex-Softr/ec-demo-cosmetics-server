import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { ImageServices } from "./image.service";

const createImage = catchAsync(async (req, res) => {
  const uploadedBy = req.user.id || req.user._id;

  if (!uploadedBy) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "User not authorized or ID missing"
    );
  }

  const files = req.files as Express.Multer.File[];
  const images = files?.map(({ path, originalname }: Express.Multer.File) => {
    const decodedName = Buffer.from(originalname, "latin1").toString("utf8");
    return { src: path, alt: decodedName, uploadedBy };
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
  createImage,
  getAnImage,
  getAllImages,
  deleteImages,
};
