import { z } from "zod";
import { phoneNumberValidationZodSchema } from "../../userManagement/user/user.validation";

export const paymentZodSchema = z.object({
  paymentMethod: z.string({ required_error: "Payment method is required" }),
  phoneNumber: phoneNumberValidationZodSchema(true),
  transactionId: z.string().optional(),
  paymentDetails: z.record(z.any()).optional(),
});
