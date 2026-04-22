import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { Address } from "../address/address.model";
import { ROLES } from "../user/user.const";
import { TStatus } from "../user/user.interface";
import { User } from "../user/user.model";
import { isEmailOrNumberTaken } from "../user/user.util";
import { Customer } from "./customer.model";
import BdAddress from "../../../utilities/bdAddress/bdAddress";
import { detectLanguage } from "../../../utilities/formatShippingAddress";

const getAllCustomerFromDB = async (query: Record<string, unknown>) => {
  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customerData",
      },
    },
    {
      $unwind: "$customerData",
    },
    {
      $lookup: {
        from: "addresses",
        localField: "address",
        foreignField: "_id",
        as: "addressInfo",
      },
    },
    {
      $unwind: { path: "$addressInfo", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "userId",
        as: "orders",
      },
    },

    {
      $addFields: {
        totalOrders: { $size: "$orders" },
      },
    },
    {
      $project: {
        uid: 1,
        phoneNumber: 1,
        email: 1,
        name: "$customerData.fullName",
        shipping: {
          fullName: "$customerData.fullName",
          phoneNumber: "$phoneNumber",
          email: "$email",
          fullAddress: "$addressInfo.fullAddress",
          upazila: "$addressInfo.upazila",
          district: "$addressInfo.district",
          division: "$addressInfo.division",
        },
        status: 1,
        createdAt: 1,
        totalOrders: 1,
      },
    },
  ];

  const matchQuery: Record<string, unknown> = {
    role: ROLES.CUSTOMER,
  };

  if (query.phoneNumber) {
    matchQuery.phoneNumber = query.phoneNumber;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search as string, "i"); // 'i' for case-insensitive matching
    matchQuery.$or = [
      { phoneNumber: { $regex: searchRegex } },
      { address: { $regex: searchRegex } },
      { orderId: { $regex: searchRegex } },
    ];
  }

  pipeline.unshift({ $match: matchQuery });

  if (query.orderedTimes) {
    pipeline.push({
      $match: { totalOrders: { $eq: Number(query.orderedTimes) } },
    });
  }

  const customerQuery = new AggregateQueryHelper(
    User.aggregate(pipeline),
    query
  )
    .sort()
    .paginate();

  const data = await customerQuery.model;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.forEach((customer: any) => {
    if (customer.shipping) {
      const lang = detectLanguage(customer.shipping.fullAddress);
      customer.shipping.upazila = BdAddress.upazilaNameById(
        customer.shipping.upazila,
        lang
      )?.name;
      customer.shipping.district = BdAddress.districtNameById(
        customer.shipping.district,
        lang
      )?.name;
      customer.shipping.division = BdAddress.divisionNameById(
        customer.shipping.division,
        lang
      )?.name;
    }
  });
  const total =
    (await User.aggregate([{ $match: matchQuery }, { $count: "total" }]))![0]
      ?.total || 0;
  const meta = customerQuery.metaData(total);

  return {
    meta,
    data,
  };
};

const getSingleCustomerByAdminFromDB = async (id: string) => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        _id: new Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customerData",
      },
    },
    {
      $unwind: "$customerData",
    },
    {
      $lookup: {
        from: "addresses",
        localField: "address",
        foreignField: "_id",
        as: "addressInfo",
      },
    },
    {
      $unwind: { path: "$addressInfo", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "userId",
        as: "orders",
      },
    },

    {
      $addFields: {
        totalOrders: { $size: "$orders" },
      },
    },
    {
      $project: {
        uid: 1,
        phoneNumber: 1,
        email: 1,
        name: "$customerData.fullName",
        shipping: {
          fullName: "$customerData.fullName",
          phoneNumber: "$phoneNumber",
          email: "$email",
          fullAddress: "$addressInfo.fullAddress",
          upazila: "$addressInfo.upazila",
          district: "$addressInfo.district",
          division: "$addressInfo.division",
        },
        status: 1,
        createdAt: 1,
        totalOrders: 1,
      },
    },
  ];

  const user = (await User.aggregate(pipeline))[0];
  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
  if (user.shipping) {
    const lang = detectLanguage(user.shipping.fullAddress);
    user.shipping.upazila = BdAddress.upazilaNameById(
      user.shipping.upazila,
      lang
    )?.name;
    user.shipping.district = BdAddress.districtNameById(
      user.shipping.district,
      lang
    )?.name;
    user.shipping.division = BdAddress.divisionNameById(
      user.shipping.division,
      lang
    )?.name;
  }
  return user;
};

const updateCustomerIntoDB = async (
  user: TJwtPayload,
  payload: Record<string, unknown>
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userData = await User.findById(user.id).session(session);
    const { address, fullName, phoneNumber, email } = payload as {
      fullName: string;
      phoneNumber: string;
      email: string;
      address: {
        fullAddress: string;
      };
    };

    if (phoneNumber || email) {
      await isEmailOrNumberTaken({
        phoneNumber: phoneNumber,
        email: email,
      });

      await User.findOneAndUpdate(
        { _id: userData?._id },
        { phoneNumber, email },
        {
          new: true,
          runValidators: true,
          session,
        }
      );
    }

    if (fullName) {
      await Customer.findOneAndUpdate(
        { _id: userData?.customer },
        { fullName },
        {
          new: true,
          runValidators: true,
          session,
        }
      );
    }

    if (address) {
      await Address.findOneAndUpdate({ _id: userData?.address }, address, {
        new: true,
        runValidators: true,
        session,
      });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const updateCustomerNyAdminIntoDB = async (
  id: string,
  payload: Record<string, unknown>
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userData = await User.findById(id).session(session);
    const { address, fullName, phoneNumber, email, status } = payload as {
      fullName: string;
      phoneNumber: string;
      email: string;
      address: {
        fullAddress: string;
      };
      status: TStatus;
    };

    if (phoneNumber || email || status) {
      const updatedDoc: Record<string, unknown> = {};
      if (phoneNumber || email) {
        await isEmailOrNumberTaken({
          phoneNumber: phoneNumber,
          email: email,
        });
        updatedDoc.phoneNumber = phoneNumber;
        updatedDoc.email = email;
      }

      if (status) {
        updatedDoc.status = status;
      }

      await User.findOneAndUpdate(
        { _id: userData?._id },
        { ...updatedDoc },
        {
          new: true,
          runValidators: true,
          session,
        }
      );
    }

    if (fullName) {
      await Customer.findOneAndUpdate(
        { _id: userData?.customer },
        { fullName },
        {
          new: true,
          runValidators: true,
          session,
        }
      );
    }

    if (address) {
      await Address.findOneAndUpdate({ _id: userData?.address }, address, {
        new: true,
        session,
      });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const CustomerServices = {
  getAllCustomerFromDB,
  updateCustomerIntoDB,
  getSingleCustomerByAdminFromDB,
  updateCustomerNyAdminIntoDB,
};
