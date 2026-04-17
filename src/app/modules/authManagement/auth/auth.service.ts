import { Request } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import { Types } from "mongoose";
import otpGenerator from "otp-generator";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { jwtHelper } from "../../../helper/jwt.helper";
import { sendEmail } from "../../../utilities/sendEmail";
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

    // if (verifiedToken.role !== ROLES.CUSTOMER) {
    //   throw new ApiError(httpStatus.FORBIDDEN, "Invalid token");
    // }
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
  const { email } = req.body;

  const user = await User.findOne({ email }).select("_id role");
  if (!user || user.role !== ROLES.CUSTOMER) {
    throw new ApiError(httpStatus.NOT_FOUND, "No user found with this email");
  }

  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  try {
    await sendEmail({
      to: email,
      subject: `${config.companyInfo?.name} - Password Reset OTP`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827; margin-bottom: 8px;">Password Reset</h2>
          <p style="color: #6b7280;">Use the OTP below to reset your password. It is valid for <strong>10 minutes</strong>.</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; text-align: center; padding: 16px 0;">${otp}</div>
          <p style="color: #6b7280; font-size: 13px;">Do not share this code with anyone.</p>
        </div>
      `,
    });
    await PasswordResetOtp.deleteMany({ email });
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to send email. Please try again."
    );
  }

  const otpData: TPasswordResetOtpData = {
    userId: user._id,
    email,
    requestedIP: req.clientIp as string,
    requestedSession: req.ecSID.id,
    otp,
  };
  const storeOtp = await PasswordResetOtp.create(otpData);
  if (!storeOtp) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Please try again later."
    );
  }
};

const resetPassword = async (
  sessionID: string,
  payload: {
    email: string;
    otp: string;
    newPassword: string;
  }
) => {
  const findRequest = await PasswordResetOtp.findOne({ email: payload.email });
  if (!findRequest) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP not found or expired");
  }
  if (findRequest.requestedSession !== sessionID) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
  }
  if (findRequest.otp !== payload.otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP did not match");
  }

  const user = await User.findOne({ email: findRequest.email });
  if (user) {
    user.password = payload.newPassword;
    await user.save();
    await PasswordResetOtp.deleteMany({ email: payload.email });
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
