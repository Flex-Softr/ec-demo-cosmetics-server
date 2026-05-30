import { Types } from "mongoose";
import { permissionList } from "../../../const/permission.const";
import { User } from "../user/user.model";
import { TPermission, TPermissionData } from "./permission.interface";
import { Permission } from "./permission.model";

const getAllPermissionsFromDB = async (): Promise<TPermission[]> => {
  const existingPermissions = await Permission.find().select({ name: 1 });
  const existingNames = new Set(existingPermissions.map((item) => item.name));
  const missingPermissions = permissionList
    .filter((name) => !existingNames.has(name))
    .map((name) => ({ name }));

  if (missingPermissions.length) {
    await Permission.insertMany(missingPermissions);
  }

  const result = await Permission.find()
    .select({ __v: 0 })
    .sort({ createdAt: -1 });
  return result;
};

const createPermissionIntoDB = async (
  payload: TPermissionData[]
): Promise<TPermission[]> => {
  const data = payload.map((item) => ({ name: item }));
  const result = await Permission.create(data);
  return result;
};

const addPermissionToUserIntoDB = async (
  userId: Types.ObjectId,
  permissionIds: Types.ObjectId[]
) => {
  const result = await User.findByIdAndUpdate(
    userId,
    {
      permissions: permissionIds,
    },
    { new: true }
  );
  return result;
};

export const PermissionServices = {
  getAllPermissionsFromDB,
  createPermissionIntoDB,
  addPermissionToUserIntoDB,
};
