import { CookieOptions, Request, Response } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import config from "../../../config/config";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TUser } from "./user.interface";
import { UserServices } from "./user.service";

const getAllAdminAndStaff = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await UserServices.getAllAdminAndStaffFromDB(
    req.query as unknown as Record<string, string>,
    req.user as unknown as TJwtPayload
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All admin and staff retrieved successfully",
    meta,
    data,
  });
});

const createCustomer = catchAsync(async (req: Request, res: Response) => {
  const { personalInfo, address, ...userInfo } = req.body;
  const result = await UserServices.createCustomerIntoDB(
    personalInfo,
    address,
    userInfo,
    req
  );
  const { authData, newUser } = result;
  const cookieOption: CookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
  };
  res.cookie("_app.ec.rt", authData.refreshToken, cookieOption);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "User created successfully",
    data: { user: newUser, accessToken: authData.accessToken },
  });
});

const createAdminOrStaff = catchAsync(async (req: Request, res: Response) => {
  req.body.personalInfo.profilePicture = (req.files as {
    path: string;
  }[])![0]?.path;
  const { personalInfo, address, ...userInfo } = req.body;
  const result = await UserServices.createAdminOrStaffIntoDB(
    personalInfo,
    address,
    userInfo
  );
  successResponse<TUser>(res, {
    statusCode: httpStatus.CREATED,
    message: `${userInfo.role} created successfully`,
    data: result,
  });
});

const updateAdminOrStaff = catchAsync(async (req: Request, res: Response) => {
  if (req.files) {
    req.body = {
      ...req.body,
      personalInfo: {
        ...req.body.personalInfo,
        profilePicture: (req.files as {
          path: string;
        }[])![0]?.path,
      },
    };
  }

  const { personalInfo, address, ...userInfo } = req.body;

  await UserServices.updateAdminOrStaffIntDB(
    new Types.ObjectId(req.params.id),
    personalInfo,
    address,
    userInfo
  );
  successResponse<TUser>(res, {
    statusCode: httpStatus.OK,
    message: `User updated successfully.`,
  });
});

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user as TJwtPayload;
  const result = await UserServices.geUserProfileFromDB(id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Profile retrieved successfully",
    data: result,
  });
});

export const UserControllers = {
  updateAdminOrStaff,
  getAllAdminAndStaff,
  createCustomer,
  createAdminOrStaff,
  getUserProfile,
};
