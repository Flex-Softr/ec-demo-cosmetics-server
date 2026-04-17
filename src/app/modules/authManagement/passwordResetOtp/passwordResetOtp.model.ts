import { Schema, model } from "mongoose";
import { TPasswordResetOtp } from "./passwordResetOtp.interface";

const PasswordResetOtpSchema = new Schema<TPasswordResetOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    requestedIP: {
      type: String,
      required: true,
    },
    requestedSession: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expireAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // expires in 10 minutes
    },
  },
  { timestamps: true }
);
PasswordResetOtpSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
export const PasswordResetOtp = model<TPasswordResetOtp>(
  "PasswordResetOtp",
  PasswordResetOtpSchema
);
