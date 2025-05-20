// import { Types } from "mongoose";
// import { TagModel } from "./tag.model";
// import { TTag } from "./tag.interface";

import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";
import VariationModel from "./variation.model";

// const createTagIntoDB = async (createdBy: Types.ObjectId, payload: TTag) => {
//   payload.createdBy = createdBy;
//   const isTagDeleted = await TagModel.findOne({
//     name: payload.name,
//     isDeleted: true,
//   });

//   if (isTagDeleted) {
//     const result = await TagModel.findByIdAndUpdate(
//       isTagDeleted._id,
//       { createdBy, isDeleted: false },
//       { new: true }
//     );
//     return result;
//   } else {
//     const result = await TagModel.create(payload);
//     return result;
//   }
// };

// const getAllTagsFromDB = async () => {
//   const result = await TagModel.find({ isDeleted: false }, "name");
//   return result;
// };

// const updateTagIntoDB = async (
//   createdBy: Types.ObjectId,
//   id: string,
//   payload: TTag
// ) => {
//   payload.createdBy = createdBy;

//   const isTagExist = await TagModel.findById(id);
//   if (!isTagExist) {
//     throw new ApiError(httpStatus.NOT_FOUND, "The Tag was not found!");
//   }

//   if (isTagExist.isDeleted) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "The Tag is deleted!");
//   }

//   const isUpdateTagDeleted = await TagModel.findOne({
//     name: payload.name,
//     isDeleted: true,
//   });

//   if (isUpdateTagDeleted) {
//     const result = await TagModel.findByIdAndUpdate(
//       isUpdateTagDeleted._id,
//       { createdBy, isDeleted: false },
//       { new: true }
//     );
//     await TagModel.findByIdAndUpdate(id, { isDeleted: true });
//     return result;
//   } else {
//     const result = await TagModel.findByIdAndUpdate(id, payload, {
//       new: true,
//     });
//     return result;
//   }
// };

const deleteVariationIntoDB = async (id: string) => {
  const isVariationExist = await VariationModel.findById(id);
  if (!isVariationExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The Variation was not found!");
  }

  if (isVariationExist.isDeleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The Variation is already deleted!"
    );
  }

  const result = await VariationModel.findByIdAndUpdate(id, {
    isDeleted: true,
  });

  return result;
};

export const VariationServices = {
  // createVariationIntoDB,
  // getAllTagsFromDB,
  // updateVariationIntoDB,
  deleteVariationIntoDB,
};
