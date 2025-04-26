import httpStatus from "http-status";
import ApiError from "../errorHandlers/ApiError";

const sendSms = async (mobileNumbers: string[], body: string) => {
  try {
    // SMS sending logic here

    // eslint-disable-next-line no-console
    console.log({
      message: "SMS sended successfully",
      mobileNumbers: mobileNumbers.join(","),
      body,
    });
  } catch (err) {
    const error = err as Error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to send sms. Message - ${error.message}`
    );
  }
};

export default sendSms;
