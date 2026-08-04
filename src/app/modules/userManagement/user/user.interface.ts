import { Document, Model, Types } from "mongoose";
import { TAddress } from "../../../types/address";
import { TAdmin } from "../admin/admin.interface";
import { TCustomer } from "../customer/customer.interface";
import { TPermission } from "../permission/permission.interface";
import { TStaff } from "../staff/staff.interface";

import { roleList } from "./user.const";

export type TRoles = (typeof roleList)[number];

export type TStatus = "active" | "banned" | "deleted";

export type TUser = {
  _id: string;
  uid: string;
  role: TRoles;
  phoneNumber: string;
  email?: string;
  password: string;
  customer: Types.ObjectId | TCustomer;
  staff: Types.ObjectId | TStaff;
  admin: Types.ObjectId | TAdmin;
  address: Types.ObjectId | TAddress;
  permissions: Types.ObjectId[] | TPermission[];
  createdBy: Types.ObjectId | TUser;
  status: TStatus;
  is_system?: boolean;
} & Document;

export type TUserModel = {
  isPasswordMatch(
    givenPassWord: string,
    savedPassword: string
  ): Promise<boolean>;
  isUserExist(
    id: Record<string, unknown>
  ): Promise<Pick<
    TUser,
    "password" | "uid" | "_id" | "role" | "permissions"
  > | null>;
} & Model<TUser>;
