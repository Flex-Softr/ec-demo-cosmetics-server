import { Document } from "mongoose";
import { permissionList } from "../../../const/permission.const";

export type TPermissionNames = (typeof permissionList)[number];

export type TPermissionData = {
  name: TPermissionNames;
};

export type TPermission = TPermissionData & Document;
