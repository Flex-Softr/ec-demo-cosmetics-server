import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";
import { ROLES } from "./user.const";
import { User } from "./user.model";
import { TUser } from "./user.interface";

const findLastCustomer = async (): Promise<string | undefined> => {
  const lastCustomer = await User.findOne({ role: ROLES.CUSTOMER }, { uid: 1 })
    .sort({
      createdAt: -1,
    })
    .lean();
  return lastCustomer?._id ? lastCustomer?.uid.substring(3) : undefined;
};

export const createCustomerId = async (): Promise<string> => {
  const currentId = (await findLastCustomer()) || "0";
  const incrementedId = (parseInt(currentId) + 1).toString().padStart(7, "0");
  const date = new Date();
  const newId = `C${date.getFullYear().toString().substring(2)}${incrementedId}`;
  return newId;
};

export const createAdminOrStaffId = async (isStaff: boolean) => {
  let lastId = undefined;
  if (isStaff) {
    const lastStaff = await User.findOne({ role: ROLES.STAFF }, { uid: 1 })
      .sort({ createdAt: -1 })
      .lean();
    lastId = lastStaff?._id ? lastStaff.uid.substring(3) : undefined;
  } else {
    const lastAdmin = await User.findOne(
      { role: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
      { uid: 1 }
    )
      .sort({ createdAt: -1 })
      .lean();
    lastId = lastAdmin?._id ? lastAdmin.uid.substring(3) : undefined;
  }
  const currentId = lastId || "0";
  const incrementedId = (parseInt(currentId) + 1).toString().padStart(3, "0");
  const date = new Date();
  const newId = `${isStaff ? "S" : "A"}${date.getFullYear().toString().substring(2)}${incrementedId}`;
  return newId;
};

//

export const createSwitchField = (fieldName: string) => ({
  [fieldName]: {
    $switch: {
      branches: [
        {
          case: { $eq: ["$role", ROLES.SUPER_ADMIN] },
          then: { $arrayElemAt: [`$admin.${fieldName}`, 0] },
        },
        {
          case: { $eq: ["$role", ROLES.ADMIN] },
          then: { $arrayElemAt: [`$admin.${fieldName}`, 0] },
        },
        {
          case: { $eq: ["$role", ROLES.STAFF] },
          then: { $arrayElemAt: [`$staff.${fieldName}`, 0] },
        },
        {
          case: { $eq: ["$role", ROLES.CUSTOMER] },
          then: { $arrayElemAt: [`$customer.${fieldName}`, 0] },
        },
      ],
      default: null,
    },
  },
});

export const isEmailOrNumberTaken = async (data: {
  phoneNumber?: string;
  email?: string;
}): Promise<TUser | undefined> => {
  const { phoneNumber, email } = data;
  const searchQuery: Record<string, unknown>[] = [];

  if (phoneNumber && phoneNumber.trim() !== "") {
    searchQuery.push({ phoneNumber: phoneNumber.trim() });
  }

  if (email && email.trim() !== "") {
    searchQuery.push({
      email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
    });
  }

  if (searchQuery.length === 0) return;

  // Check for any existing account with the same email or phone
  const isExist = await User.findOne({
    $or: searchQuery,
  });

  if (isExist) {
    // If the account is NOT deleted, it's truly taken
    if (isExist.status !== "deleted") {
      if (phoneNumber && isExist.phoneNumber?.trim() === phoneNumber.trim()) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "This 'Phone number' is already taken"
        );
      }

      if (
        email &&
        isExist.email?.toLowerCase() === email.trim().toLowerCase()
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "This 'Email' is already taken"
        );
      }
    }

    // If it IS deleted, return it so the service can decide to reactivate it
    return isExist as TUser;
  }

  return;
};
