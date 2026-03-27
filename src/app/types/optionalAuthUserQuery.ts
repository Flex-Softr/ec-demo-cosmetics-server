import mongoose from "mongoose";
import { TOptionalAuthGuardPayload } from "./common";

const optionalAuthUserQuery = (user: TOptionalAuthGuardPayload) => {
  const query: {
    userId?: mongoose.Types.ObjectId;
    sessionId?: string;
    phoneNumber?: string;
  } = {};

  // Note: Even for admins, we want to filter by userId or sessionId when using this helper,
  // as it is typically used for personal context (like Carts).
  // Admin-specific operations (like viewing all orders) handle their own queries.

  if (user.id || user.isAuthenticated) {
    query.userId = user.id;
    query.phoneNumber = user.data?.phoneNumber;
  } else {
    query.sessionId = user.sessionId;
  }
  return query;
};

export default optionalAuthUserQuery;
