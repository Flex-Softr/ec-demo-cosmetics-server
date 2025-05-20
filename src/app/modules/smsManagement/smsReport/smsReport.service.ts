import { SMSReport } from "./smsReport.model";

const getSMSCountFromDB = async () => {
  const smsCount = (
    await SMSReport.aggregate([
      {
        $match: {
          status: "success",
        },
      },
      {
        $group: {
          _id: null,
          smsCount: { $sum: "$smsCount" },
        },
      },
    ])
  )[0];

  const res = {
    smsCount: smsCount.smsCount,
  };

  return res;
};

export const SMSReportServices = {
  getSMSCountFromDB,
};
