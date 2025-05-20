import { Document } from "mongoose";

export type TSMSStatus = "success" | "failed";
export type TSMSType = "T" | "B";

export type TSMSReportInput = {
  receiverNumbers: string[];
  receiversCount: number;
  messageBody: string;
  status: TSMSStatus;
  operatortransid: string;
  smsType: TSMSType;
  billMsisdn: string;
  operatorStatusCode: string;
};

export type TSMSReport = TSMSReportInput & Document;
