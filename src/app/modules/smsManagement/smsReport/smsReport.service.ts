import { SMSReport } from "./smsReport.model";

const getSMSCountFromDB = async () => {
  const totalReceiversCount = (
    await SMSReport.aggregate([
      {
        $match: {
          status: "success",
        },
      },
      {
        $group: {
          _id: null,
          totalReceiversCount: { $sum: "$receiversCount" },
        },
      },
    ])
  )[0];

  const res = {
    totalSmsSended: totalReceiversCount.totalReceiversCount,
  };

  return res;
};

export const SMSReportServices = {
  getSMSCountFromDB,
};
