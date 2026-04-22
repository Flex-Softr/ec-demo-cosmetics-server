import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import { TContactMessage } from "./contactMessage.interface";
import { ContactMessageModel } from "./contactMessage.model";
import { QueryHelper } from "../../helper/query.helper";

const createContactMessageIntoDB = async (payload: TContactMessage) => {
  const result = await ContactMessageModel.create(payload);
  return result;
};

const getAllContactMessagesFromDB = async (query: Record<string, unknown>) => {
  const contactMessageQuery = new QueryHelper(ContactMessageModel.find(), query)
    .search(["name", "email", "phone", "subject", "message"])
    .sort()
    .paginate()
    .select();

  const result = await contactMessageQuery.model;
  const meta = await contactMessageQuery.metaData();

  return {
    meta,
    result,
  };
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

const updateContactMessageStatusIntoDB = async (id: string) => {
  const result = await ContactMessageModel.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Contact message not found!");
  }
  return result;
};

const getUnreadContactMessagesCountFromDB = async () => {
  const count = await ContactMessageModel.countDocuments({ isRead: false });
  return count;
};

export const ContactMessageService = {
  createContactMessageIntoDB,
  getAllContactMessagesFromDB,
  getSingleContactMessageFromDB,
  deleteContactMessageFromDB,
  updateContactMessageStatusIntoDB,
  getUnreadContactMessagesCountFromDB,
};
