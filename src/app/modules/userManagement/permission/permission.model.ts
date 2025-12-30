import { Schema, model } from "mongoose";
import { permissionList } from "../../../const/permission.const";
import { TPermission } from "./permission.interface";

const PermissionSchema = new Schema<TPermission>({
  name: {
    type: String,
    enum: permissionList,
    required: true,
    unique: true,
  },
});

export const Permission = model<TPermission>("Permission", PermissionSchema);
