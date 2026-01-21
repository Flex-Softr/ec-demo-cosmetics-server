import { z } from "zod";
import { InventoryValidation } from "../inventory/inventory.validation";
import { PriceValidation } from "../price/price.validation";

export const productVariations = z.object({
  attributes: z.record(z.string()), // Use `z.record` for dynamic key-value pairs
  price: PriceValidation.price,
  inventory: InventoryValidation.inventorySchema,
  isActive: z.boolean().optional(),
});
