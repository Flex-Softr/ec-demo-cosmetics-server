import { z } from "zod";
import { OrderSMSNotificationConst } from "./orderSMSNotification.const";

const createOrderSMSNotification = z.object({
  body: z.object({
    notificationData: z
      .object({
        slug: z.enum(
          [...OrderSMSNotificationConst.orderSMSNotificationType] as [
            string,
            ...string[],
          ],
          {
            required_error: "Slug is required.",
          }
        ),
        defaultTemplate: z.string({
          required_error: "Default template is required",
        }),
        customTemplate: z.string().optional(),
        isActive: z.boolean().optional().default(true),
        activeMedium: z
          .array(
            z.enum([
              ...OrderSMSNotificationConst.OrderSMSNotificationMedium,
            ] as [string, ...string[]])
          )
          .optional()
          .default([]),
        emailSubject: z.string().optional().default("Order Notification"),
      })
      .array(),
  }),
});

export const OrderSMSNotificationValidation = {
  createOrderSMSNotification,
};
