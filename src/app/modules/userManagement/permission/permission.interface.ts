import { Document } from "mongoose";

export type TPermissionNames =
  | "super admin"
  | "manage product"
  | "manage permission"
  | "manage admin or staff"
  | "manage coupon"
  | "manage shipping charges"
  | "manage orders"
  | "manage warehouse"
  | "manage courier"
  | "manage warranty claim"
  | "manage image to order"
  | "manage customers"
  | "manage sms";

export type TPermissionData = {
  name: TPermissionNames;
};

export type TPermission = TPermissionData & Document;
