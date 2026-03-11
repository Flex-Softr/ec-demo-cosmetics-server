import mongoose from "mongoose";
import { TOptionalAuthGuardPayload } from "./common";
import { ROLES } from "../modules/userManagement/user/user.const";

const optionalAuthUserQuery = (user: TOptionalAuthGuardPayload) => {
  const query: {
    userId?: mongoose.Types.ObjectId;
    sessionId?: string;
    phoneNumber?: string;
  } = {};

  // If the user is an admin or superAdmin, we don't want to filter by userId
  // so they can view any order.
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) {
    return query;
  }

  if (user.id || user.isAuthenticated) {
    query.userId = user.id;
    query.phoneNumber = user.data?.phoneNumber;
  } else {
    query.sessionId = user.sessionId;
  }
  return query;
};

export default optionalAuthUserQuery;
