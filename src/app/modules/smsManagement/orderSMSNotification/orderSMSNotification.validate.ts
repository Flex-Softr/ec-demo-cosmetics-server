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
      })
      .array(),
  }),
});

export const OrderSMSNotificationValidation = {
  createOrderSMSNotification,
};
