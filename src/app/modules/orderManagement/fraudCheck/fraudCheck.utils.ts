/* eslint-disable @typescript-eslint/no-explicit-any */
import { Courier, FormatFraudCheckData, Report } from "./fraudCheck.interface";
import { paperFlyFraudCheck } from "./paperFlyFraudCheck";
import { pathaoFraudCheck } from "./pathaoFraudCheck";
import { redXFraudCheck } from "./redXFraudCheck";
import { steadfastFraudCheck } from "./steadfastFraudCheck";

function formatValue(value: number) {
  return value % 1 === 0 ? value : Math.round(value); // 84.33=84 84.55=85
  // return value % 1 === 0 ? value : parseFloat(value.toFixed(2)); // 84.3333=84.33 84.5456=84.55
}

const formatSteadfastFraudData = async (mobile: string) => {
  try {
    const res = await steadfastFraudCheck(mobile);

    const reports: Report[] = [];

    if (res?.frauds && res?.frauds?.length > 0) {
      res?.frauds?.forEach((entry: any) => {
        reports.push({
          reportFrom: "Steadfast",
          comment: entry.details,
          date: entry.created_at,
        });
      });
    }

    const totalOrders =
      (res?.total_delivered || 0) + (res?.total_cancelled || 0);
    const totalDeliveries = res?.total_delivered || 0;
    const totalCancellations = res?.total_cancelled || 0;
    const successRatio = (totalDeliveries / totalOrders) * 100 || 0;

    const couriers: Courier[] = [
      {
        name: "Steadfast",
        logo: "https://i.ibb.co.com/tM68nWR/stead-fast.png",
        orders: totalOrders,
        deliveries: totalDeliveries,
        cancellations: totalCancellations,
        deliveryRate: formatValue(successRatio),
      },
    ];
    const data: FormatFraudCheckData = {
      totalOrders,
      totalDeliveries,
      totalCancellations,
      couriers,
      reports,
    };
    return data;
  } catch (error: any) {
    return {
      error: true,
      errorFrom: "Steadfast",
      message: error.message,
      totalOrders: 0,
      totalDeliveries: 0,
      totalCancellations: 0,
      couriers: [],
      reports: [],
    };
  }
};

const formatPathaoFraudData = async (mobile: string) => {
  try {
    const res = await pathaoFraudCheck(mobile);

    const reports: Report[] = [];

    if (res.data?.fraud_reason || res.data?.customer?.fraud_reason) {
      reports.push({
        reportFrom: "Pathao",
        comment: res.data?.customer?.fraud_reason || res.data?.fraud_reason,
        date: "",
        // date: new Date().toISOString().split("T")[0],
      });
    }

    const totalOrders = res.data?.customer?.total_delivery || 0;
    const totalDeliveries = res.data?.customer?.successful_delivery || 0;
    const totalCancellations = totalOrders - totalDeliveries;
    const successRatio = (totalDeliveries / totalOrders) * 100 || 0;

    const couriers: Courier[] = [
      {
        name: "Pathao",
        logo: "https://i.ibb.co.com/b1xNZJY/pathao.png",
        orders: totalOrders,
        deliveries: totalDeliveries,
        cancellations: totalCancellations,
        deliveryRate: formatValue(successRatio),
      },
    ];
    const data: FormatFraudCheckData = {
      totalOrders,
      totalDeliveries,
      totalCancellations,
      couriers,
      reports,
    };
    return data;
  } catch (error: any) {
    return {
      error: true,
      errorFrom: "Pathao",
      message: error.message,
      totalOrders: 0,
      totalDeliveries: 0,
      totalCancellations: 0,
      couriers: [],
      reports: [],
    };
  }
};

const formatRedXFraudData = async (mobile: string) => {
  try {
    const res = await redXFraudCheck(mobile);

    const totalOrders = parseInt(res.data?.totalParcels, 10) || 0;
    const totalDeliveries = parseInt(res.data?.deliveredParcels, 10) || 0;
    const totalCancellations = totalOrders - totalDeliveries;
    const successRatio = (totalDeliveries / totalOrders) * 100 || 0;

    const couriers: Courier[] = [
      {
        name: "RedX",
        logo: "https://i.ibb.co.com/NWL7Tr4/redx.png",
        orders: totalOrders,
        deliveries: totalDeliveries,
        cancellations: totalCancellations,
        deliveryRate: formatValue(successRatio),
      },
    ];
    const data: FormatFraudCheckData = {
      totalOrders,
      totalDeliveries,
      totalCancellations,
      couriers,
    };
    return data;
  } catch (error: any) {
    return {
      error: true,
      errorFrom: "RedX",
      message: error.message,
      totalOrders: 0,
      totalDeliveries: 0,
      totalCancellations: 0,
      couriers: [],
      reports: [],
    };
  }
};

const formatPaperFlyFraudData = async (mobile: string) => {
  try {
    const res = await paperFlyFraudCheck(mobile);

    if (!res.records?.length) {
      return {
        totalOrders: 0,
        totalDeliveries: 0,
        totalCancellations: 0,
        couriers: [
          {
            name: "PaperFly",
            logo: "https://go.paperfly.com.bd/static/assets/paperfly-logo.d67bc8c5.png",
            orders: 0,
            deliveries: 0,
            cancellations: 0,
            deliveryRate: 0,
          },
        ],
      };
    }

    const { delivered = "0", returned = "0" } = res.records[0] || {};
    const totalDeliveries = parseInt(delivered, 10) || 0;
    const totalCancellations = parseInt(returned, 10) || 0;
    const totalOrders = totalDeliveries + totalCancellations;
    const successRatio = totalOrders
      ? (totalDeliveries / totalOrders) * 100
      : 0;

    const couriers: Courier[] = [
      {
        name: "PaperFly",
        logo: "https://go.paperfly.com.bd/static/assets/paperfly-logo.d67bc8c5.png",
        orders: totalOrders,
        deliveries: totalDeliveries,
        cancellations: totalCancellations,
        deliveryRate: formatValue(successRatio),
      },
    ];
    const data: FormatFraudCheckData = {
      totalOrders,
      totalDeliveries,
      totalCancellations,
      couriers,
    };
    return data;
  } catch (error: any) {
    return {
      error: true,
      errorFrom: "PaperFly",
      message: error.message,
      totalOrders: 0,
      totalDeliveries: 0,
      totalCancellations: 0,
      couriers: [],
      reports: [],
    };
  }
};

export {
  formatSteadfastFraudData,
  formatPathaoFraudData,
  formatRedXFraudData,
  formatPaperFlyFraudData,
  formatValue,
};
