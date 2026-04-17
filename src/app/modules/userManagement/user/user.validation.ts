import { z } from "zod";
import { ROLES } from "./user.const";
const phoneNumberRegex = /^(?!.*[a-zA-Z])01\d{9}$/;
const passwordValidatorRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%&*]).{8,}$/;

export const phoneNumberValidationZodSchema = (isOptional: boolean = false) => {
  const ValidationErrorMessage =
    "Please provide a valid mobile number starting with 01 and with a total of 11 digits.";
  return isOptional
    ? z
        .string()
        .refine((value) => phoneNumberRegex.test(value), {
          message: ValidationErrorMessage,
        })
        .optional()
    : z
        .string({ required_error: "Phone number is required." })
        .refine((value) => phoneNumberRegex.test(value), {
          message: ValidationErrorMessage,
        });
};

export const passwordZodSchema = z
  .string({ required_error: "Password is required" })
  .refine((password) => passwordValidatorRegex.test(password), {
    message:
      "Invalid password. It must be 8 characters long with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@#$%&*).",
  });

const createAddressSchema = (fullAddressRequired = false) =>
  z.object({
    fullAddress: fullAddressRequired
      ? z.string({ required_error: "Full address is required" })
      : z.string().optional(),
    division: z.string().optional(),
    district: z.string().optional(),
    upazila: z.string().optional(),
  });

const createCustomer = z.object({
  body: z.object({
    phoneNumber: phoneNumberValidationZodSchema(),
    email: z.string().email().optional(),
    password: passwordZodSchema,
    address: createAddressSchema(),
    personalInfo: z.object({
      fullName: z.string().optional(),
      email: z.string().email().optional(),
    }),
  }),
});

const createStaffOrAdmin = z.object({
  body: z.object({
    phoneNumber: phoneNumberValidationZodSchema(),
    email: z.string({ required_error: "Email is required." }).email(),
    password: passwordZodSchema,
    role: z.enum([ROLES.STAFF, ROLES.ADMIN], {
      required_error: "Role is required",
    }),
    address: createAddressSchema(true),
    personalInfo: z.object(
      {
        fullName: z.string({ required_error: "Full name is required." }),
        profilePicture: z.string().optional(),
        emergencyContact: phoneNumberValidationZodSchema(true),
        NIDNo: z.string().optional(),
        birthCertificateNo: z.string().optional(),
        joiningDate: z.string().optional(),
        dateOfBirth: z.string().optional(),
      },
      { required_error: "Some properties from personal info is required" }
    ),
  }),
});
const updateStaffOrAdmin = z.object({
  body: z.object({
    phoneNumber: phoneNumberValidationZodSchema(true),
    email: z.string().email().optional(),
    address: createAddressSchema().optional(),
    personalInfo: z
      .object({
        fullName: z.string().optional(),
        profilePicture: z.string().optional(),
        emergencyContact: phoneNumberValidationZodSchema(true),
        NIDNo: z.string().optional(),
        birthCertificateNo: z.string().optional(),
        joiningDate: z.string().optional(),
        dateOfBirth: z.string().optional(),
      })
      .optional(),
  }),
});

export const UserValidation = {
  updateStaffOrAdmin,
  createCustomer,
  createStaffOrAdmin,
};
