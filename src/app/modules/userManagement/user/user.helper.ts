import httpStatus from "http-status";
import { ClientSession, Model } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { TAddressData } from "../../../types/address";
import { Address } from "../address/address.model";
import { TAdmin } from "../admin/admin.interface";
import { TStaff } from "../staff/staff.interface";
import { ROLES } from "./user.const";
import { TRoles, TUser } from "./user.interface";
import { User } from "./user.model";
import { createAdminOrStaffId } from "./user.util";

const createAdminOrStaffUser = async (
  role: TRoles,
  modelName: Model<TAdmin | TStaff>,
  userInfo: TUser,
  personalInfo: TAdmin | TStaff,
  addressData: TAddressData,
  session: ClientSession
): Promise<TUser> => {
  const id = await createAdminOrStaffId(role === ROLES.STAFF);
  userInfo.uid = id;
  personalInfo.uid = id;

  const [createdModel] = await modelName.create([personalInfo], { session });
  if (!createdModel) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to create the ${userInfo.role}`
    );
  }

  addressData.uid = id;
  const [address] = await Address.create([addressData], { session });
  if (!address) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create address");
  }
  userInfo.address = address;
  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) {
    userInfo.admin = createdModel._id;
  } else if (role === ROLES.STAFF) {
    userInfo.staff = createdModel._id;
  } else if (role === ROLES.CUSTOMER) {
    userInfo.customer = createdModel._id;
  }

  const [user] = await User.create([userInfo], { session });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to create the user`);
  }

  return user;
};

export const UserHelpers = {
  createAdminOrStaffUser,
};
