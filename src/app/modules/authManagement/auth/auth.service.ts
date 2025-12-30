import { Request } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import { Types } from "mongoose";
import otpGenerator from "otp-generator";
import twilio from "twilio";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { jwtHelper } from "../../../helper/jwt.helper";
// import { errorLogger } from "../../../utilities/logger";
import { ROLES } from "../../userManagement/user/user.const";
import { User } from "../../userManagement/user/user.model";
import { TPasswordResetOtpData } from "../passwordResetOtp/passwordResetOtp.interface";
import { PasswordResetOtp } from "../passwordResetOtp/passwordResetOtp.model";
import { RefreshToken } from "../refreshToken/refreshToken.model";
import { authHelpers } from "./auth.helper";
import {
  TChangePasswordPayload,
  TJwtPayload,
  TRefreshTokenResponse,
} from "./auth.interface";

const login = async (
  req: Request,
  payload: { phoneEmailOrUid: string; password: string }
) => {
  const { phoneEmailOrUid, password } = payload;

  const user = await User.isUserExist({
    $or: [
      {
        phoneNumber: phoneEmailOrUid,
      },
      { email: phoneEmailOrUid },
      { uid: phoneEmailOrUid },
    ],
  });

  if (!(await User.isPasswordMatch(password, user?.password as string))) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid phone number or password!"
    );
  }

  return await authHelpers.loginUser(req, user);
};

const refreshToken = async (
  ip: string,
  sessionId: string,
  token: string
): Promise<TRefreshTokenResponse> => {
  let verifiedToken = null;
  // const isTokenExist = await RefreshToken.findOne({ token });
  // if (!isTokenExist) {
  //   throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized request");
  // }

  // if (sessionId !== isTokenExist.sessionId || isTokenExist.ip !== ip) {
  //   await RefreshToken.deleteOne({ token });
  //   errorLogger.error(
  //     `Tried to access ${isTokenExist._id} this account, from ${ip} this ip.`
  //   );
  //   throw new ApiError(httpStatus.BAD_REQUEST, "Un authorized request");
  // }

  try {
    verifiedToken = jwtHelper.verifyToken<TJwtPayload>(
      token,
      config.token_data.refresh_token_secret as Secret
    );
    if (verifiedToken.role !== ROLES.CUSTOMER) {
      throw new ApiError(httpStatus.FORBIDDEN, "Invalid token");
    }
  } catch (error) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid token");
  }

  const { id } = verifiedToken as TJwtPayload;

  const isExist = await User.isUserExist({ _id: id });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  const accessToken = jwtHelper.createToken(
    {
      id: isExist._id.toString(),
      role: isExist.role as string,
      permissions:
        (isExist.permissions.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => ({ _id: item._id, name: item.name })
        ) as unknown as { _id: string; name: string }[]) || [],
      uid: isExist.uid as string,
      // sessionId: isTokenExist.sessionId,
    },
    config.token_data.access_token_secret as Secret,
    config.token_data.access_token_expires as string
  );

  return { accessToken };
};

const changePassword = async (
  payload: TChangePasswordPayload,
  userIno: TJwtPayload
) => {
  const { newPassword, previousPassword } = payload;
  const user = await User.findOne({ _id: userIno.id }).select("+password");
  if (
    user?.password &&
    !(await User.isPasswordMatch(previousPassword, user?.password as string))
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The previous password did not match!"
    );
  }
  if (user?.password) {
    user.password = newPassword;
  }
  user?.save();
};

const logoutUser = async (token: string) => {
  await RefreshToken.deleteOne({ token });
};

const getLoggedInDevicesFromDB = async (userId: Types.ObjectId) => {
  const result = await RefreshToken.find({ userId }, { deviceData: 1 });
  return result;
};

const forgetPassword = async (req: Request): Promise<void> => {
  const { phoneNumber } = req.body;
  const user = await User.isUserExist({ phoneNumber });

  if (user?.role !== ROLES.CUSTOMER) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No User found");
  }

  const client: twilio.Twilio = twilio(
    config.twilio.sid,
    config.twilio.auth_token
  );
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: true,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  try {
    await client.messages.create({
      body: `Please don't share this code with anyone,Your Oneself password reset code is ${otp} , This otp is only validate for 10 minutes.`,
      from: config.twilio.phone_number,
      to: `+88${phoneNumber}`,
    });
    await PasswordResetOtp.deleteMany({ phoneNumber });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to send SMS");
  }
  const otpData: TPasswordResetOtpData = {
    userId: user?._id,
    phoneNumber,
    requestedIP: req.clientIp as string,
    requestedSession: req.ecSID.id,
    otp,
  };
  const storeOtp = await PasswordResetOtp.create(otpData);
  if (!storeOtp) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "PLase try again later."
    );
  }
};

const resetPassword = async (
  sessionID: string,
  payload: {
    phoneNumber: string;
    otp: string;
    newPassword: string;
  }
) => {
  const findRequest = await PasswordResetOtp.findOne({
    phoneNumber: payload.phoneNumber,
  });
  if (findRequest?.requestedSession !== sessionID) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
  }
  if (findRequest?.otp !== payload.otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Otp did not matched");
  }

  const user = await User.findOne({ phoneNumber: findRequest.phoneNumber });
  if (user) {
    user.password = payload.newPassword;
    await user.save();
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
  }
};

export const AuthServices = {
  login,
  refreshToken,
  changePassword,
  logoutUser,
  getLoggedInDevicesFromDB,
  forgetPassword,
  resetPassword,
};
