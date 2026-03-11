import mongoose from "mongoose";
import { TResponseMeta } from "../utilities/successResponse";
import { TUser } from "../modules/userManagement/user/user.interface";

export type TMetaAndDataRes<T> = {
  meta: TResponseMeta;
  data: T | null;
};

export type TOptionalAuthGuardPayload = {
  isAuthenticated: boolean;
  id?: mongoose.Types.ObjectId;
  role?: string;
  uid?: string;
  iat?: Date;
  exp?: Date;
  sessionId?: string;
  data?: TUser;
};
