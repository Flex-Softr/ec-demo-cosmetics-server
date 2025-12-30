import { TStatus } from "./user.interface";

export const ROLES = {
  SUPER_ADMIN: "superAdmin",
  ADMIN: "admin",
  STAFF: "staff",
  CUSTOMER: "customer",
} as const;

export const roleList = Object.values(ROLES);

export const statusEnum: TStatus[] = ["active", "banned", "deleted"];
