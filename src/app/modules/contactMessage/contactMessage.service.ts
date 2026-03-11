import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import { TContactMessage } from "./contactMessage.interface";
import { ContactMessageModel } from "./contactMessage.model";

const createContactMessageIntoDB = async (payload: TContactMessage) => {
  const result = await ContactMessageModel.create(payload);
  return result;
};

const getAllContactMessagesFromDB = async () => {
  const result = await ContactMessageModel.find().sort({ createdAt: -1 });
  return result;
};

const getSingleContactMessageFromDB = async (id: string) => {
  const result = await ContactMessageModel.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Contact message not found!");
  }
  return result;
};

const deleteContactMessageFromDB = async (id: string) => {
  const result = await ContactMessageModel.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Contact message not found!");
  }
  return result;
};

export const ContactMessageService = {
  createContactMessageIntoDB,
  getAllContactMessagesFromDB,
  getSingleContactMessageFromDB,
  deleteContactMessageFromDB,
};
