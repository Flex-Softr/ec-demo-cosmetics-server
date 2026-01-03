import config from "../../config/config";
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

  const result = await Courier.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: "images",
        localField: "image",
        foreignField: "_id",
        as: "image",
      },
    },
    { $unwind: { path: "$image", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        image: {
          $cond: {
            if: { $not: ["$image"] },
            then: null,
            else: {
              _id: "$image._id",
              src: { $concat: [config.image_base_url, "/", "$image.src"] },
              alt: "$image.alt",
            },
          },
        },
      },
    },
  ]);
  return result;
};

const getCourierByIdFromDB = async (id: string) => {
  const result = await Courier.findById(id).populate("image");
  if (
    result &&
    result.image &&
    typeof result.image === "object" &&
    "src" in result.image
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result.image as any).src = config.image_base_url + "/" + result.image.src;
  }
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
