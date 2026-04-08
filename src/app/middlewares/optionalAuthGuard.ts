import { RequestHandler } from "express";
import { Secret } from "jsonwebtoken";
import config from "../config/config";
import { jwtHelper } from "../helper/jwt.helper";
import { TJwtPayload } from "../modules/authManagement/auth/auth.interface";
import { User } from "../modules/userManagement/user/user.model";

const optionalAuthGuard: RequestHandler = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token) {
      token = token?.split(" ")[1];
    } else {
      token = req?.cookies["_app.ec.at"];
    }

    if (token) {
      try {
        const verifiedUser = jwtHelper.verifyToken<TJwtPayload>(
          token,
          config.token_data.access_token_secret as Secret
        );
        await User.isUserExist({ _id: verifiedUser.id });
        req.user = { isAuthenticated: true, ...verifiedUser };
      } catch {
        // Token is invalid, expired, or user no longer exists.
        // Treat as unauthenticated guest — this is expected behavior for optional auth.
        req.user = {
          isAuthenticated: false,
          sessionId: req.ecSID.id,
        };
      }
    } else {
      req.user = {
        isAuthenticated: false,
        sessionId: req.ecSID.id,
      };
    }

    next();
  } catch (error) {
    // Only reaches here for truly unexpected errors (e.g., DB connection issues)
    next(error);
  }
};

export default optionalAuthGuard;
