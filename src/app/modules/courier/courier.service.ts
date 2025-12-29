import { TCourierData } from "./courier.interface";
import { Courier } from "./courier.model";

const createCourierIntoDB = async (payload: TCourierData) => {
  const result = await Courier.create(payload);
  return result;
};

const getAllCouriersFromDB = async (query?: Record<string, unknown>) => {
  const matchQuery: Record<string, unknown> = {};
  if (query?.isActive) {
    matchQuery.isActive = query.isActive === "true";
  }
  const result = await Courier.find(matchQuery);
  return result;
};

const getCourierByIdFromDB = async (id: string) => {
  const result = await Courier.findById(id);
  return result;
};

const updateCourierIntoDB = async (
  id: string,
  payload: Partial<TCourierData>
) => {
  const result = await Courier.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteCourierFromDB = async (id: string) => {
  const result = await Courier.findByIdAndDelete(id);
  return result;
};

export const CourierServices = {
  createCourierIntoDB,
  getAllCouriersFromDB,
  getCourierByIdFromDB,
  updateCourierIntoDB,
  deleteCourierFromDB,
};
