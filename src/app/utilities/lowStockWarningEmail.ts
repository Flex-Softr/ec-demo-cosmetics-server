import httpStatus from "http-status";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";
import { lowStockWarningError } from "./logger";
import sendMail from "./nodeMailerConfig";

const lowStockWarningEmail = async ({
  productName,
  currentStock,
  sku,
}: {
  productName: string;
  currentStock: number;
  sku?: string;
}) => {
  const html = `<div style="font-family: sans-serif; font-size: 16px;">
        <h3>Dear Admin</h3>
        <p>This is an automated notification to inform you that the stock level for the following product has dropped
            below the threshold:</p>
        <ul>
            <li><span style="font-size: 18px; font-weight: 600;">Product name: </span> <span
                    style="font-size: 18px;">${productName}</span>
            </li>
            <li><span style="font-size: 18px; font-weight: 600;">Current Stock Level: </span>
                <span style="font-size: 18px;">${currentStock}</span>
            </li>
            <li><span style="font-size: 18px; font-weight: 600;">SKU: </span>
                <span>${sku}</span>
            </li>
        </ul>
        <p>Please restock this item as soon as possible to avoid potential out-of-stock situations.</p>
    </div>`;

  try {
    const res = await sendMail({
      subject: `Low Stock Alert: Action Needed for ${productName}`,
      to: [String(config?.companyInfo?.email)],
      html,
    });
    return res;
  } catch (error) {
    if (config.env === "development") {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error as string);
    }
    lowStockWarningError.error("Failed to send email", error);
  }
};

export default lowStockWarningEmail;
