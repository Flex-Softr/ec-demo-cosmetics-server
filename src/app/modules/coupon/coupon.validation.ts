import { z } from "zod";
import { couponDiscountType } from "./coupon.const";

const createCoupon = z.object({
  body: z.object({
    name: z.string({ required_error: "Coupon name is required!" }),
    shortDescription: z.string().optional(),
    slug: z.string().optional(),
    code: z.string({ required_error: "Coupon code is required!" }),
    discountType: z.enum([...couponDiscountType] as [string, ...string[]]),
    discountValue: z.number({
      required_error: "Coupon discount value is required",
    }),
    maxDiscount: z
      .number()
      .min(1, { message: "Max discount amount must be greater than 1!" })
      .optional(),
    minimumOrderValue: z
      .number()
      .min(1, { message: "Minium order value must be greater than 1!" })
      .optional(),
    startDate: z.string().optional(),
    usageLimit: z.number().optional(),
    usageCount: z.number().optional(),
    onlyForRegisteredUsers: z.boolean().optional(),
    allowedUsers: z.array(z.string()).optional(),
    fixedCategories: z.array(z.string()).optional(),
    restrictedCategories: z.array(z.string()).optional(),
    fixedProducts: z.array(z.string()).optional(),
    endDate: z.string({ required_error: "Coupon end date is required." }),
    isActive: z.boolean().default(true),
    isDeleted: z.boolean().default(false),
    tags: z.array(z.string().optional()).optional(),
  }),
});

const updateCoupon = z.object({
  body: z.object({
    name: z.string().optional(),
    shortDescription: z.string().optional(),
    slug: z.string().optional(),
    code: z.string().optional(),
    discountType: z
      .enum([...couponDiscountType] as [string, ...string[]])
      .optional(),
    discountValue: z
      .number()
      .min(1, { message: "Discount value must be greater than 1!" })
      .optional(),
    maxDiscount: z
      .number()
      .min(0, { message: "Max discount amount must be positive number!" })
      .optional(),
    minimumOrderValue: z
      .number()
      .min(0, { message: "Minium order value must be positive number!" })
      .optional(),
    startDate: z.string().optional(),
    usageLimit: z
      .number()
      .min(0, { message: "Usage limit must be positive number!" })
      .optional(),
    usageCount: z.number().optional(),
    onlyForRegisteredUsers: z.boolean().optional(),
    allowedUsers: z.array(z.string()).optional(),
    fixedCategories: z.array(z.string()).optional(),
    restrictedCategories: z.array(z.string()).optional(),
    fixedProducts: z.array(z.string()).optional(),
    endDate: z.string().optional(),
    isActive: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const CouponValidation = { createCoupon, updateCoupon };
