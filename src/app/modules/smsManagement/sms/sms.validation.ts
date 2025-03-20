import { z } from "zod";

const bulkSms = z.object({
  body: z.object({
    mobileNumbers: z
      .array(z.string(), {
        required_error: "Mobile numbers is required",
      })
      .min(1, "At least one mobile number is required"),
    messageBody: z.string({ required_error: "Message body is required" }),
  }),
});

export const SmsValidation = { bulkSms };
