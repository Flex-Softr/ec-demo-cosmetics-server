import { Upazila } from "./upazila.model";
import { TUpazila } from "./upazila.types";

const createIntoDB = async (payload: TUpazila[]) => {
  const res = await Upazila.insertMany(payload);
  return res;
};

const getAllUpazilasFromDB = async () => {
  const data = await Upazila.find().sort({ createdAt: -1 });
  return data;
};

export const UpazilaService = {
  createIntoDB,
  getAllUpazilasFromDB,
};
