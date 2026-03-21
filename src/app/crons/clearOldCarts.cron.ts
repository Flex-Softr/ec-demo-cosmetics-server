import { CronJob } from "cron";
import { Cart } from "../modules/cart/cart.model";
import { consoleLogger, errorLogger } from "../utilities/logger";

/**
 * Safety-net cron to clean up cart items that somehow have no expireAt set
 * (e.g., items created before the TTL index migration).
 * MongoDB TTL index handles the primary cleanup automatically.
 * Runs every day at 3:00 AM (Asia/Dhaka).
 */
new CronJob(
  "0 3 * * *", // 3:00 AM daily
  async () => {
    try {
      consoleLogger.info(
        `🧹 Cart Safety-Net Cleanup: removing legacy items with no expireAt.`
      );

      // Remove any items without expireAt — these are pre-migration orphans
      const result = await Cart.deleteMany({
        expireAt: { $exists: false },
      });

      consoleLogger.info(
        `✅ Safety-Net Cleanup Done. Deleted ${result.deletedCount} legacy guest cart items.`
      );
    } catch (error) {
      errorLogger.error("❌ Error in Cart Cleanup Cron:", error);
    }
  },
  null,
  true,
  "Asia/Dhaka"
);
