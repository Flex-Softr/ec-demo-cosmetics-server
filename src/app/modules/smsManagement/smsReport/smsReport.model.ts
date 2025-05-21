import { model, Schema } from "mongoose";
import { TSMSReport } from "./smsReport.interface";

const SMSReportSchema = new Schema<TSMSReport>(
  {
    receiverNumbers: {
      type: [String],
      required: true,
    },
    receiversCount: {
      type: Number,
      required: true,
    },
    messageBody: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
    },
    operatortransid: {
      type: String,
      required: true,
    },
    operatorStatusCode: {
      type: String,
      required: true,
    },
    smsType: {
      type: String,
      enum: ["T", "B"],
      required: true,
    },
    billMsisdn: {
      type: String,
    },
    smsCount: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const SMSReport = model<TSMSReport>("sms_report", SMSReportSchema);
