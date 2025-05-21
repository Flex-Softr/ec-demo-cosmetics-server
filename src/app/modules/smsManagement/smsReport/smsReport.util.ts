import { TSMSReportInput } from "./smsReport.interface";
import { SMSReport } from "./smsReport.model";

const createSMSReport = async (payload: TSMSReportInput) => {
  await SMSReport.create(payload);
};

export const SMSReportUtil = { createSMSReport };
