import nodemailer from "nodemailer";
import config from "../config/config";

type TEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export const sendEmail = async (options: TEmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: `"${config.companyInfo?.name}" <${config.smtp?.user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};
