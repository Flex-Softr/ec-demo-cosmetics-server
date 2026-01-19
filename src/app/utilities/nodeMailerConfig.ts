import httpStatus from "http-status";
import nodemailer from "nodemailer";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.google.smtp_user,
    pass: config.google.smtp_pass,
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
    if (!config.google.smtp_user) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "No smtp user id found."
      );
    }
    if (!config.google.smtp_pass) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "No smtp password id found."
      );
    }
    const res = await transporter.sendMail({
      from: `${config.company_name} ${config.admin_email}`,
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
