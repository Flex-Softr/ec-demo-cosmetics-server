import axios from "axios";
import config from "../../config/config";

const credentials = {
  username: config.banglaLink.user,
  password: config.banglaLink.pass,
  bill_msisdn: config.banglaLink.bill_msisdn,
};

const sendSMS = async ({
  msisdn,
  cli = "Oneself",
  messagetype,
  message,
  clienttransid,
  tran_type,
}: {
  msisdn: string[];
  cli?: string;
  messagetype: "1" | "3"; // 1 for english and 3 for unicode message
  message: string;
  clienttransid: string;
  tran_type: "T" | "P";
}) => {
  const url = `${config.banglaLink.base_url}/api/v1/smsapigw/`;
  const res = await axios(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      ...credentials,
      apicode: "5",
      msisdn,
      countrycode: "880",
      cli,
      messagetype,
      message,
      clienttransid,
      tran_type,
      request_type: tran_type === "P" ? "B" : "S",
      rn_code: "91",
    },
  });

  return res.data;
};

const checkBallance = async ({ clienttransid }: { clienttransid: string }) => {
  const url = `${config.banglaLink.base_url}/ecmapigw/webresources/ecmapigw.v3`;
  const res = await axios(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      ...credentials,
      bill_msisdn: undefined,
      apicode: "3",
      clienttransid,
    },
  });

  return res.data;
};

export const banglaLinkUtil = {
  sendSMS,
  checkBallance,
};
