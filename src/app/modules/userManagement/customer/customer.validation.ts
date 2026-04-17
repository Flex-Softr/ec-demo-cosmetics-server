import { z } from "zod";
import { shippingValidationZodSchema } from "../../orderManagement/shipping/shipping.validation";
import { phoneNumberValidationZodSchema } from "../user/user.validation";

const updateUser = z.object({
  body: z.object({
    fullName: z.string().optional(),
    address: shippingValidationZodSchema(true).optional(),
    phoneNumber: phoneNumberValidationZodSchema(true),
    email: z.string().email().optional(),
  }),
});

export const CustomerValidation = {
  updateUser,
};
