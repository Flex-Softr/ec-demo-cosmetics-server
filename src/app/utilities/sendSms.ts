import httpStatus from "http-status";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";
import { SMSReportUtil } from "../modules/smsManagement/smsReport/smsReport.util";
import { banglaLinkUtil } from "./banglalink";
import createBLClientSid from "./banglalink/createBLClientSid";
import { detectLanguageType } from "./detectLanguageType";

const sendSms = async (
  mobileNumbers: string[],
  body: string,
  tran_type: "T" | "P"
) => {
  const clienttransid = createBLClientSid();
  const smsLanguageType = detectLanguageType(body);
  let res;
  try {
    // SMS sending logic here
    if (config.env === "production") {
      res = await banglaLinkUtil.sendSMS({
        msisdn: mobileNumbers,
        clienttransid,
        cli: "Oneself",
        messagetype: smsLanguageType === "Unicode" ? "3" : "1",
        message: body,
        tran_type,
      });
    } else {
      // eslint-disable-next-line no-console
      console.log("TO test SMS in development turn it on from sendSms util.", {
        message: "SMS sended successfully",
        mobileNumbers: mobileNumbers.join(","),
        body,
      });
    }
  } catch (err) {
    const error = err as Error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to send sms. Message - ${error.message}`
    );
  }

  const smsCount =
    smsLanguageType === "Unicode"
      ? Math.ceil(body.length / 70)
      : Math.ceil(body.length / 160);

  try {
    await SMSReportUtil.createSMSReport({
      billMsisdn: config.banglaLink.bill_msisdn || "",
      messageBody: body,
      operatorStatusCode: res?.statusInfo?.statusCode || "",
      operatortransid: res?.statusInfo?.serverReferenceCode || "",
      receiverNumbers: mobileNumbers,
      receiversCount: mobileNumbers.length,
      smsType: tran_type === "P" ? "B" : "T",
      status:
        res?.statusInfo?.errordescription === "Failure" ? "failed" : "success",
      smsCount: smsCount * mobileNumbers.length,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export default sendSms;
