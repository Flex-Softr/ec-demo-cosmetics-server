import { STOCK_STATUS } from "./inventory.const";
import { TStockStatus } from "./inventory.interface";

/**
 * Calculates the stock status based on available quantity and low stock warning threshold.
 *
 * @param available - The current available stock quantity.
 * @param lowStockWarning - The threshold for low stock status.
 * @returns TStockStatus - The calculated stock status.
 */
export const calculateStockStatus = (
  available: number,
  lowStockWarning: number
): TStockStatus => {
  if (available <= 0) {
    return STOCK_STATUS.OUT_OF_STOCK;
  }
  if (available <= lowStockWarning) {
    return STOCK_STATUS.LOW_STOCK;
  }
  return STOCK_STATUS.IN_STOCK;
};
