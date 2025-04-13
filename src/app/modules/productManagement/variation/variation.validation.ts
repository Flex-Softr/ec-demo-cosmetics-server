import { z } from "zod";
import { PriceValidation } from "../price/price.validation";
import { InventoryValidation } from "../inventory/inventory.validation";

export const productVariations = z.object({
  attributes: z.record(z.string()), // Use `z.record` for dynamic key-value pairs
  price: PriceValidation.price,
  inventory: InventoryValidation.inventory,
});
