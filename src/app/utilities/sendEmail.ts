import nodemailer from "nodemailer";
import config from "../config/config";

type TEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: config.google.smtp_user,
    pass: config.google.smtp_pass,
  },
});

export const sendEmail = async (options: TEmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: `"${config.companyInfo?.name}" <${config.google?.smtp_user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};
