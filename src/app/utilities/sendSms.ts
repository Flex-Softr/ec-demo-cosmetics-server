import httpStatus from "http-status";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";
// import { banglaLinkUtil } from "./banglalink";
// import createBLClientSid from "./banglalink/createBLClientSid";
// import { detectLanguageType } from "./detectLanguageType";

const sendSms = async (mobileNumbers: string[], body: string) => {
  try {
    // SMS sending logic here

    if (config.env === "development") {
      // await banglaLinkUtil.sendSMS({
      //   msisdn: mobileNumbers,
      //   clienttransid: createBLClientSid(),
      //   cli: "OneselfBD",
      //   messagetype: detectLanguageType(body) === "Unicode" ? "3" : "1",
      //   message: body,
      // });
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
};

export default sendSms;
