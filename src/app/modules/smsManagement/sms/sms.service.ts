import sendSms from "../../../utilities/sendSms";

const sendBulkSms = async (mobileNumbers: string[], messageBody: string) => {
  await sendSms(mobileNumbers, messageBody);
};

export const smsServices = { sendBulkSms };
