import { Request } from "express";
import fsEx from "fs-extra";
import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TAddressData } from "../../../types/address";
import isPermitted from "../../../utilities/isPermitted";
import { authHelpers } from "../../authManagement/auth/auth.helper";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { Address } from "../address/address.model";
import { TAdmin } from "../admin/admin.interface";
import { Admin } from "../admin/admin.model";
import { TCustomer } from "../customer/customer.interface";
import { Customer } from "../customer/customer.model";
import { TStaff } from "../staff/staff.interface";
import { Staff } from "../staff/staff.model";
import { ROLES } from "./user.const";
import { UserHelpers } from "./user.helper";
import { TUser } from "./user.interface";
import { User } from "./user.model";
import {
  createCustomerId,
  createSwitchField,
  isEmailOrNumberTaken,
} from "./user.util";

import path from "path";

const getAllAdminAndStaffFromDB = async (
  query: Record<string, string>,
  user: TJwtPayload
) => {
  const matchQuery: Record<string, unknown> = {
    role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] },
    status: { $ne: "deleted" },
  };

  const fields = [
    "fullName",
    "emergencyContact",
    "profilePicture",
    "NIDNo",
    "birthCertificateNo",
    "dateOfBirth",
    "joiningDate",
  ];
  const addFieldsStage = fields.reduce((acc, field) => {
    return { ...acc, ...createSwitchField(field) };
  }, {});

  const isSuperAdmin = isPermitted(user.permissions);
  const pipeline: PipelineStage[] = [
    { $match: matchQuery },
    {
      $lookup: {
        from: "admins",
        localField: "admin",
        foreignField: "_id",
        as: "admin",
      },
    },
    {
      $lookup: {
        from: "staffs",
        localField: "staff",
        foreignField: "_id",
        as: "staff",
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },

    {
      $lookup: {
        from: "addresses",
        localField: "address",
        foreignField: "_id",
        as: "addressData",
      },
    },
    {
      $addFields: {
        ...addFieldsStage,
        permissions: isSuperAdmin
          ? {
              $map: {
                input: "$permissionsData",
                as: "perm",
                in: { _id: "$$perm._id", name: "$$perm.name" },
              },
            }
          : 0,
        address: {
          $arrayElemAt: ["$addressData", 0],
        },
      },
    },
    {
      $project: {
        _id: 1,
        uid: 1,
        role: 1,
        phoneNumber: 1,
        email: 1,
        status: 1,
        fullName: 1,
        emergencyContact: 1,
        profilePicture: {
          $cond: {
            if: "$profilePicture",
            then: { $concat: [config.image_base_url, "/", "$profilePicture"] },
            else: "$profilePicture",
          },
        },
        NIDNo: 1,
        birthCertificateNo: 1,
        dateOfBirth: 1,
        joiningDate: 1,
        permissions: 1,
        address: {
          fullAddress: "$address.fullAddress",
        },
        createdAt: 1,
      },
    },
  ];

  if (query.search) {
    const searchRegex = new RegExp(query.search, "i"); // Partial case-insensitive match
    pipeline.push({
      $match: {
        $or: [
          { fullName: { $regex: searchRegex } }, // Match name with partial search
          { uid: { $regex: searchRegex } }, // Match userId with partial search
        ],
      },
    });
  }

  if (isSuperAdmin) {
    pipeline.splice(4, 0, {
      $lookup: {
        from: "permissions",
        localField: "permissions",
        foreignField: "_id",
        as: "permissionsData",
      },
    });
  }

  const usersQuery = new AggregateQueryHelper(User.aggregate(pipeline), query)
    .sort()
    .paginate();
  const data = await usersQuery.model;
  const total =
    (await User.aggregate([{ $match: matchQuery }, { $count: "total" }]))![0]
      ?.total || 0;
  const meta = usersQuery.metaData(total);

  return { data, meta };
};

const createCustomerIntoDB = async (
  personalInfo: TCustomer,
  addressData: TAddressData,
  userInfo: TUser,
  req: Request
) => {
  // check that the phone number is already registered
  await isEmailOrNumberTaken({
    phoneNumber: userInfo.phoneNumber,
    email: userInfo.email,
  });

  // change user role
  userInfo.role = ROLES.CUSTOMER;
  let newUser = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = await createCustomerId();

    personalInfo.uid = id;
    // create customer
    const [createCustomer] = await Customer.create([personalInfo], {
      session,
    });
    if (!createCustomer) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
    }

    addressData.uid = id;
    // create address
    const [address] = await Address.create([addressData], { session });

    if (!address) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create address");
    }

    userInfo.uid = id;
    userInfo.customer = createCustomer._id;
    userInfo.address = address._id;
    const [user] = await User.create([userInfo], { session });
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
    }
    newUser = user;
    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
  if (newUser) {
    newUser = await User.findOne(
      { _id: newUser._id },
      { uid: 1, role: 1, phoneNumber: 1, email: 1, customer: 1 }
    ).populate([{ path: "customer", select: "fullName -_id" }]);
  }

  const authData = await authHelpers.loginUser(req, newUser);

  return { newUser, authData };
};

const createAdminOrStaffIntoDB = async (
  personalInfo: TAdmin | TStaff,
  address: TAddressData,
  userInfo: TUser
): Promise<TUser | null> => {
  // check that the phone number is already registered
  await isEmailOrNumberTaken({
    phoneNumber: userInfo.phoneNumber,
    email: userInfo.email,
  });

  let newUser = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Create Admin or staff account base on request type
    if (userInfo.role === ROLES.ADMIN) {
      newUser = await UserHelpers.createAdminOrStaffUser(
        ROLES.ADMIN,
        Admin,
        userInfo,
        personalInfo,
        address,
        session
      );
    } else if (userInfo.role === ROLES.STAFF) {
      newUser = await UserHelpers.createAdminOrStaffUser(
        ROLES.STAFF,
        Staff,
        userInfo,
        personalInfo,
        address,
        session
      );
    }
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
  newUser = await User.findById(newUser?._id).populate([
    {
      path: newUser?.role.toLowerCase() as string,
      select: "-createdAt -updatedAt",
    },
    { path: "address", select: "-createdAt -updatedAt" },
  ]);
  return newUser;
};

const updateAdminOrStaffIntDB = async (
  id: Types.ObjectId,
  personalInfo: TAdmin | TStaff,
  address: TAddressData,
  userInfo: TUser
) => {
  const isExist = await User.findOne({ _id: id }).populate([
    {
      path: "admin",
      select: "profilePicture",
    },
    {
      path: "staff",
      select: "profilePicture",
    },
  ]);
  if (!isExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const updatedUserData: Record<string, unknown> = {};
    if (userInfo?.phoneNumber || userInfo?.email) {
      await isEmailOrNumberTaken({
        phoneNumber: userInfo.phoneNumber,
        email: userInfo.email,
      });
      updatedUserData.phoneNumber = userInfo?.phoneNumber;
      updatedUserData.email = userInfo?.email;
    }
    if (userInfo?.status) {
      updatedUserData.status = userInfo?.status;
    }

    if (Object.keys(updatedUserData).length) {
      await User.findOneAndUpdate({ _id: isExist._id }, updatedUserData);
    }

    if (address) {
      await Address.findOneAndUpdate({ _id: isExist.address }, address, {
        session,
      });
    }

    if (personalInfo) {
      if (isExist.role === ROLES.ADMIN) {
        await Admin.findOneAndUpdate({ _id: isExist.admin }, personalInfo, {
          session,
        });
      } else if (isExist.role === ROLES.STAFF) {
        await Staff.findOneAndUpdate({ _id: isExist.staff }, personalInfo, {
          session,
        });
      }
    }

    const filePathToDelete = (isExist?.admin as TAdmin)?.profilePicture
      ? (isExist?.admin as TAdmin)?.profilePicture
      : (isExist?.staff as TStaff)?.profilePicture
        ? (isExist?.staff as TStaff)?.profilePicture
        : undefined;

    if (filePathToDelete) {
      try {
        const folderPath = path.parse(filePathToDelete).dir;

        await fsEx.remove(folderPath);
      } catch (error) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Failed to delete previous image"
        );
      }
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const geUserProfileFromDB = async (id: Types.ObjectId) => {
  const fields = [
    "fullName",
    "emergencyContact",
    "profilePicture",
    "NIDNo",
    "birthCertificateNo",
    "dateOfBirth",
    "joiningDate",
  ];
  const addFieldsStage = fields.reduce((acc, field) => {
    return { ...acc, ...createSwitchField(field) };
  }, {});

  const result = (
    await User.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: "admins",
          localField: "admin",
          foreignField: "_id",
          as: "admin",
        },
      },
      {
        $lookup: {
          from: "staffs",
          localField: "staff",
          foreignField: "_id",
          as: "staff",
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $lookup: {
          from: "permissions",
          localField: "permissions",
          foreignField: "_id",
          as: "permissionsData",
        },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "address",
          foreignField: "_id",
          as: "addressData",
        },
      },
      {
        $addFields: {
          ...addFieldsStage,
          permissions: {
            $map: {
              input: "$permissionsData",
              as: "perm",
              in: { _id: "$$perm._id", name: "$$perm.name" },
            },
          },
          address: {
            $arrayElemAt: ["$addressData", 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          uid: 1,
          role: 1,
          phoneNumber: 1,
          email: 1,
          status: 1,
          fullName: 1,
          emergencyContact: 1,
          profilePicture: {
            $cond: {
              if: "$profilePicture",
              then: {
                $concat: [config.image_base_url, "/", "$profilePicture"],
              },
              else: "$profilePicture",
            },
          },
          NIDNo: 1,
          birthCertificateNo: 1,
          dateOfBirth: 1,
          joiningDate: 1,
          permissions: 1,
          address: {
            fullAddress: "$address.fullAddress",
          },
        },
      },
    ])
  )[0];
  return result;
};

export const UserServices = {
  getAllAdminAndStaffFromDB,
  createCustomerIntoDB,
  createAdminOrStaffIntoDB,
  updateAdminOrStaffIntDB,
  geUserProfileFromDB,
};
