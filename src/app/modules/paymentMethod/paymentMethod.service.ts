import config from "../../config/config";
import { TJwtPayload } from "../authManagement/auth/auth.interface";
import { TPaymentMethod } from "./paymentMethod.interface";
import { PaymentMethod } from "./paymentMethod.model";

const getAllPaymentMethodsFromDB = async (
  query?: Record<string, unknown>
): Promise<TPaymentMethod[]> => {
  const matchQuery: Record<string, unknown> = { isDeleted: false };
  if (query?.isActive) {
    matchQuery.isActive = query.isActive === "true";
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: "images",
        localField: "logo",
        foreignField: "_id",
        as: "logo",
      },
    },
    { $unwind: { path: "$logo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        instructions: 1,
        isActive: 1,
        required_inputs: 1,
        logo: {
          _id: "$logo._id",
          src: { $concat: [config.image_base_url, "/", "$logo.src"] },
          alt: "$logo.alt",
        },
      },
    },
  ];

  const result = await PaymentMethod.aggregate(pipeline);

  return result;
};

const createPaymentMethod = async (
  payload: TPaymentMethod,
  user: TJwtPayload
): Promise<TPaymentMethod> => {
  const result = await PaymentMethod.create({ ...payload, createdBy: user.id });
  return result;
};

const updatePaymentMethodIntoDB = async (
  id: string,
  payload: Partial<TPaymentMethod>
): Promise<TPaymentMethod | null> => {
  const result = await PaymentMethod.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deletePaymentMethodFromDB = async (
  id: string
): Promise<TPaymentMethod | null> => {
  const result = await PaymentMethod.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  return result;
};

export const PaymentMethodService = {
  getAllPaymentMethodsFromDB,
  createPaymentMethod,
  updatePaymentMethodIntoDB,
  deletePaymentMethodFromDB,
};
