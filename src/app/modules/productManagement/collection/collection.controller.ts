import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { CollectionServices } from "./collection.service";

const createCollection = catchAsync(async (req, res) => {
  const result = await CollectionServices.createCollectionIntoDB(
    req.user.id || req.user._id,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Collection created successfully",
    data: result,
  });
});

const getAllCollections = catchAsync(async (req, res) => {
  const result = await CollectionServices.getAllCollectionsFromDB(req.query);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Collections retrieved successfully",
    data: result,
  });
});

const getSingleCollection = catchAsync(async (req, res) => {
  const result = await CollectionServices.getSingleCollectionFromDB(
    req.params.slug
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Collection retrieved successfully",
    data: result,
  });
});

const updateCollection = catchAsync(async (req, res) => {
  const result = await CollectionServices.updateCollectionIntoDB(
    req.params.id,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Collection updated successfully",
    data: result,
  });
});

const deleteCollection = catchAsync(async (req, res) => {
  const result = await CollectionServices.deleteCollectionFromDB(req.params.id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Collection deleted successfully",
    data: result,
  });
});

export const CollectionControllers = {
  createCollection,
  getAllCollections,
  getSingleCollection,
  updateCollection,
  deleteCollection,
};
