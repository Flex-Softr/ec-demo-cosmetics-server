import httpStatus from "http-status";
import nodemailer from "nodemailer";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export type TMailConfig = {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
};

const sendMail = async ({ to, subject, text, html }: TMailConfig) => {
  try {
    if (!to?.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No email address found to send email"
      );
    }
    if (!config.smtp.user) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "No smtp user id found."
      );
    }
    if (!config.smtp.pass) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "No smtp password id found."
      );
    }
    const res = await transporter.sendMail({
      from: `${config.companyInfo?.name} ${config.companyInfo?.email}`,
      to: to.join(","),
      subject,
      text,
      html,
    });

    return res;
  } catch (error) {
    throw new Error(error as string);
  }
};

export default sendMail;
