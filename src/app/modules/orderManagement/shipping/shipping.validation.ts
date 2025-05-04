import { phoneNumberValidationZodSchema } from "../../userManagement/user/user.validation";

import { object, string } from "zod";

export const shippingValidationZodSchema = (isOptional = false) => {
  const baseSchema = object({
    email: string().email().optional(),
    notes: string().optional(),
    city: string().optional(),
    state: string().optional(),
    country: string().optional(),
  });

  if (isOptional) {
    return baseSchema.merge(
      object({
        fullName: string().optional(),
        phoneNumber: phoneNumberValidationZodSchema(true),
        fullAddress: string().optional(),
        district: string().optional(),
        division: string().optional(),
        upazila: string().optional(),
      })
    );
  }
  return baseSchema.merge(
    object({
      fullName: string({ required_error: "Full name is required" }),
      phoneNumber: phoneNumberValidationZodSchema(),
      fullAddress: string({ required_error: "Full address is required" }),
    })
  );
};
