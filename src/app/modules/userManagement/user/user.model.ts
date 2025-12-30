import bcrypt from "bcrypt";
import httpStatus from "http-status";
import mongoose, { Schema, model } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { ROLES, statusEnum } from "./user.const";
import { TUser, TUserModel } from "./user.interface";

const UserSchema = new Schema<TUser, TUserModel>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    status: {
      type: String,
      enum: statusEnum,
      default: "active",
    },
  },

  {
    timestamps: true,
  }
);

UserSchema.statics.isPasswordMatch = async function (
  givenPassWord,
  savedPassword
) {
  return await bcrypt.compare(givenPassWord, savedPassword);
};

UserSchema.statics.isUserExist = async (field) => {
  const user = await User.findOne(field, {
    password: 1,
    role: 1,
    uid: 1,
    status: 1,
    permissions: 1,
  }).populate("permissions");
  if (!user || user.status === "deleted") {
    throw new ApiError(httpStatus.NOT_FOUND, "No user found");
  } else if (user.status === "banned") {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have been banned");
  }
  return user;
};

UserSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_round)
  );
  next();
});

export const User = model<TUser, TUserModel>("User", UserSchema);
