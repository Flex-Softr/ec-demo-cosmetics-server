import { Request } from "express";
import fsEx from "fs-extra";
import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import path from "path";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TAddressData } from "../../../types/address";
import formatShippingAddress from "../../../utilities/formatShippingAddress";
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
        is_system: 1,
        fullName: 1,
        emergencyContact: 1,
        profilePicture: 1,
        NIDNo: 1,
        birthCertificateNo: 1,
        dateOfBirth: 1,
        joiningDate: 1,
        permissions: 1,
        address: {
          fullAddress: "$address.fullAddress",
          upazila: "$address.upazila",
          district: "$address.district",
          division: "$address.division",
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await usersQuery.model).map((user: any) => {
    if (user.address) {
      user.address.fullAddress = formatShippingAddress(
        user.address,
        undefined,
        true
      );
    }
    return user;
  });
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
  // Extract email from personalInfo if it's not at the top level
  if (personalInfo.email && !userInfo.email) {
    userInfo.email = personalInfo.email;
  }

  // check that the phone number or email is already registered
  const existingUser = await isEmailOrNumberTaken({
    phoneNumber: userInfo.phoneNumber,
    email: userInfo.email,
  });

  // change user role
  userInfo.role = ROLES.CUSTOMER;
  let newUser = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (existingUser && existingUser.status === "deleted") {
      // REACTIVATION FLOW: Update the existing deleted user
      const id = existingUser.uid;

      // 1. Update/Restore Customer details
      let customerId = existingUser.customer;
      const updateCustomer = await Customer.findOneAndUpdate(
        { _id: existingUser.customer },
        { ...personalInfo, uid: id },
        { session, new: true }
      );
      if (!updateCustomer) {
        // If customer doc missing, create a new one
        const [newCustomer] = await Customer.create(
          [{ ...personalInfo, uid: id }],
          { session }
        );
        customerId = newCustomer._id;
      }

      // 2. Update/Restore Address details
      let addressId = existingUser.address;
      const updateAddress = await Address.findOneAndUpdate(
        { _id: existingUser.address },
        { ...addressData, uid: id },
        { session, new: true }
      );
      if (!updateAddress) {
        // If address doc missing, create a new one
        const [newAddress] = await Address.create(
          [{ ...addressData, uid: id }],
          {
            session,
          }
        );
        addressId = newAddress._id;
      }

      // 3. Update/Restore User status and password
      const user = await User.findOneAndUpdate(
        { _id: existingUser._id },
        {
          ...userInfo,
          status: "active",
          customer: customerId,
          address: addressId,
          uid: id,
        },
        { session, new: true }
      );
      if (!user) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Failed to reactivate account"
        );
      }
      newUser = user;
    } else {
      // NEW REGISTRATION FLOW
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
    }

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
  // Extract email from personalInfo if it's not at the top level
  if (personalInfo.email && !userInfo.email) {
    userInfo.email = personalInfo.email;
  }

  // check that the phone number or email is already registered
  const existingUser = await isEmailOrNumberTaken({
    phoneNumber: userInfo.phoneNumber,
    email: userInfo.email,
  });

  // Never allow clients to create system/protected users via this endpoint
  userInfo.is_system = false;
  if (userInfo.role === ROLES.SUPER_ADMIN) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot create a super admin from this endpoint"
    );
  }

  let newUser = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (existingUser && existingUser.status === "deleted") {
      // REACTIVATION FLOW
      const id = existingUser.uid;
      const TargetModel = userInfo.role === ROLES.ADMIN ? Admin : Staff;
      const targetId =
        userInfo.role === ROLES.ADMIN ? existingUser.admin : existingUser.staff;

      let personalDocId = targetId;

      if (targetId) {
        // 1. Update existing details if they exist
        const updatePersonal = await TargetModel.findOneAndUpdate(
          { _id: targetId },
          { ...personalInfo, uid: id },
          { session, new: true }
        );
        if (!updatePersonal) {
          // If update failed (doc missing), create a new one
          const [newPersonal] = await TargetModel.create(
            [{ ...personalInfo, uid: id }],
            { session }
          );
          personalDocId = newPersonal._id;
        }
      } else {
        // 2. Create new details if none existed for this role
        const [newPersonal] = await TargetModel.create(
          [{ ...personalInfo, uid: id }],
          { session }
        );
        personalDocId = newPersonal._id;
      }

      // 3. Update/Restore Address
      const updateAddress = await Address.findOneAndUpdate(
        { _id: existingUser.address },
        { ...address, uid: id },
        { session, new: true }
      );
      if (!updateAddress) {
        // If address missing, create new one
        const [newAddress] = await Address.create([{ ...address, uid: id }], {
          session,
        });
        existingUser.address = newAddress._id;
      }

      // 4. Reactivate User
      const user = await User.findOneAndUpdate(
        { _id: existingUser._id },
        {
          ...userInfo,
          status: "active",
          is_system: false,
          admin: userInfo.role === ROLES.ADMIN ? personalDocId : undefined,
          staff: userInfo.role === ROLES.STAFF ? personalDocId : undefined,
          address: existingUser.address,
          uid: id,
        },
        { session, new: true }
      );
      if (!user) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Failed to reactivate account"
        );
      }
      newUser = user;
    } else {
      // NEW REGISTRATION FLOW
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
    },
    {
      path: "staff",
    },
  ]);
  if (!isExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
  }

  if (isExist.is_system || isExist.role === ROLES.SUPER_ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, "System user cannot be updated");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const updatedUserData: Record<string, unknown> = {};
    // Extract email from personalInfo if it's not at the top level
    if (personalInfo?.email && !userInfo?.email) {
      userInfo = { ...userInfo, email: personalInfo.email } as TUser;
    }

    // Prevent promoting users to system/superAdmin via update
    if (userInfo?.role === ROLES.SUPER_ADMIN) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Cannot assign super admin role"
      );
    }
    delete (userInfo as Partial<TUser>).is_system;

    if (userInfo?.phoneNumber || userInfo?.email || userInfo?.role) {
      if (userInfo.phoneNumber || userInfo.email) {
        await isEmailOrNumberTaken({
          phoneNumber: userInfo.phoneNumber,
          email: userInfo.email,
        });
        updatedUserData.phoneNumber = userInfo?.phoneNumber;
        updatedUserData.email = userInfo?.email;
      }

      if (userInfo?.role && userInfo.role !== isExist.role) {
        // Handle Role Migration
        const oldRole = isExist.role;
        const newRole = userInfo.role;
        const personalData =
          oldRole === ROLES.ADMIN ? isExist.admin : isExist.staff;

        if (personalData) {
          // 1. Create new role document
          const NewModel = newRole === ROLES.ADMIN ? Admin : Staff;
          const personalDoc = personalData as unknown as {
            toObject?: () => Record<string, unknown>;
          };
          const plainData = personalDoc.toObject
            ? personalDoc.toObject()
            : { ...(personalData as unknown as Record<string, unknown>) };
          delete (plainData as Record<string, unknown>)._id;
          delete (plainData as Record<string, unknown>).createdAt;
          delete (plainData as Record<string, unknown>).updatedAt;

          // Merge with new info from request
          const finalData = { ...plainData, ...personalInfo };

          const [newPersonal] = await NewModel.create([finalData], { session });

          // 2. Update user reference and role
          updatedUserData.role = newRole;
          if (newRole === ROLES.ADMIN) {
            updatedUserData.admin = newPersonal._id;
            updatedUserData.$unset = { staff: 1 };
          } else {
            updatedUserData.staff = newPersonal._id;
            updatedUserData.$unset = { admin: 1 };
          }

          // 3. Delete old role document after session commit (handled by session if possible or manual)
          // For safety with transactions, we'll delete it now
          const OldModel = oldRole === ROLES.ADMIN ? Admin : Staff;
          await OldModel.deleteOne(
            { _id: (personalData as unknown as { _id: string })._id },
            { session }
          );
        } else {
          updatedUserData.role = newRole;
        }
      }

      updatedUserData.status = userInfo?.status;
    }

    if (userInfo?.permissions) {
      updatedUserData.permissions = userInfo.permissions;
    }

    if (Object.keys(updatedUserData).length) {
      await User.findOneAndUpdate({ _id: isExist._id }, updatedUserData, {
        session,
      });
    }

    if (address) {
      await Address.findOneAndUpdate({ _id: isExist.address }, address, {
        session,
      });
    }

    const roleChanged = userInfo?.role && userInfo.role !== isExist.role;

    if (personalInfo && !roleChanged) {
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
          is_system: 1,
          fullName: 1,
          emergencyContact: 1,
          profilePicture: 1,
          NIDNo: 1,
          birthCertificateNo: 1,
          dateOfBirth: 1,
          joiningDate: 1,
          permissions: 1,
          address: {
            fullAddress: "$address.fullAddress",
            upazila: "$address.upazila",
            district: "$address.district",
            division: "$address.division",
          },
        },
      },
    ])
  )[0];

  if (result && result.address) {
    result.address.fullAddress = formatShippingAddress(
      result.address,
      undefined,
      true
    );
  }

  return result;
};

const deleteUserFromDB = async (id: Types.ObjectId) => {
  const existingUser = await User.findById(id).select("role is_system status");
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (existingUser.is_system || existingUser.role === ROLES.SUPER_ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, "System user cannot be deleted");
  }

  const result = await User.findOneAndUpdate(
    { _id: id },
    { status: "deleted" }
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  return result;
};

export const UserServices = {
  getAllAdminAndStaffFromDB,
  createCustomerIntoDB,
  createAdminOrStaffIntoDB,
  updateAdminOrStaffIntDB,
  geUserProfileFromDB,
  deleteUserFromDB,
};
