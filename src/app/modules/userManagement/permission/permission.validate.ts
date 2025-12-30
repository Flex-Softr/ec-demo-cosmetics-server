import { z } from "zod";
import { permissionList } from "../../../const/permission.const";

const createPermission = z.object({
  body: z.object({
    names: z.array(
      z.enum([...permissionList] as [string, ...string[]], {
        required_error: "Permission name is required",
      })
    ),
  }),
});

const addPermissionToUser = z.object({
  body: z.object({
    permissions: z
      .string({ required_error: "Permissions id is required" })
      .array(),
  }),
});

export const PermissionValidation = {
  createPermission,
  addPermissionToUser,
};
