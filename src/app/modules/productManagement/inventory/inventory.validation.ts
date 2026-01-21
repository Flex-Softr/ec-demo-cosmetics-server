import { z } from "zod";
import { STOCK_STATUS } from "./inventory.const";

const inventorySchema = z
  .object({
    sku: z.string().optional(),
    stockStatus: z.enum([...Object.values(STOCK_STATUS)] as [
      string,
      ...string[],
    ]),
    stockQuantity: z.number().optional(),
    stockAvailable: z.number().optional(),
    preStockQuantity: z.number().optional(),
    productCode: z.string().optional(),
    manageStock: z.boolean().optional(),
    lowStockWarning: z.number().optional(),
    hideStock: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.manageStock) {
      if (data.stockQuantity === undefined || data.stockQuantity === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Stock quantity is required when stock management is enabled!",
          path: ["stockQuantity"],
        });
      }

      if (data.lowStockWarning === undefined || data.lowStockWarning === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Low stock warning is required when stock management is enabled!",
          path: ["lowStockWarning"],
        });
      }
    }
  });

export const InventoryValidation = {
  inventorySchema,
};
