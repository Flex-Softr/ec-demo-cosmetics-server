import { Types } from "mongoose";
import { TUser } from "../userManagement/user/user.interface";

export type TRequiredInput = {
  type: "text" | "number" | "select";
  name: string;
  is_required: boolean;
  enums?: string; // Comma separated values if type is 'select'
};

export type TPaymentMethod = {
  name: string;
  instructions?: string;
  isActive: boolean;
  logo?: Types.ObjectId;
  sortOrder?: number;
  required_inputs: TRequiredInput[];
  createdBy: Types.ObjectId | TUser;
  isDeleted: boolean;
  _id: string;
};
