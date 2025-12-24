import { TJwtPayload } from "../authManagement/auth/auth.interface";
import { TPaymentMethod } from "./paymentMethod.interface";
import { PaymentMethod } from "./paymentMethod.model";

const getAllPaymentMethodsFromDB = async (): Promise<TPaymentMethod[]> => {
  const result = await PaymentMethod.find(
    { isDeleted: false },
    { createdBy: 0, isDeleted: 0 }
  );
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
