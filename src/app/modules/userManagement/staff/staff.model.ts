import { Schema, model } from "mongoose";
import { TStaff } from "./staff.interface";

const StaffSchema = new Schema<TStaff>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    emergencyContact: {
      type: String,
    },
    NIDNo: {
      type: String,
    },
    birthCertificateNo: {
      type: String,
    },
    dateOfBirth: {
      type: String,
    },
    joiningDate: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Staff = model<TStaff>("Staff", StaffSchema);
