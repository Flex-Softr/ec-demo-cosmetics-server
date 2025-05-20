import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { VariationServices } from "./variation.service";

// const createTag = catchAsync(async (req, res) => {
//   const createdBy = req.user.id;
//   const result = await TagServices.createTagIntoDB(createdBy, req.body);
//   successResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: "Tag created successfully",
//     data: result,
//   });
// });

// const getAllTags = catchAsync(async (req, res) => {
//   const result = await TagServices.getAllTagsFromDB();
//   successResponse(res, {
//     statusCode: httpStatus.OK,
//     message: "Tags retrieved successfully",
//     data: result,
//   });
// });

// const updateTag = catchAsync(async (req, res) => {
//   const createdBy = req.user.id;
//   const variationId = req.params.id;
//   const result = await TagServices.updateTagIntoDB(createdBy, TagId, req.body);
//   successResponse(res, {
//     statusCode: httpStatus.OK,
//     message: "Tag  updated successfully",
//     data: result,
//   });
// });

const deleteVariation = catchAsync(async (req, res) => {
  // const createdBy = req.user.id;
  const variationId = req.params.id;
  await VariationServices.deleteVariationIntoDB(variationId);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Variation deleted successfully",
    data: null,
  });
});

export const VariationControllers = {
  // createVariation,
  // getAllVariations,
  // updateVariation,
  deleteVariation,
};
