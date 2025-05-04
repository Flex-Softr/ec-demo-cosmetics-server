import httpStatus from "http-status";
import mongoose, { ClientSession, Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import lowStockWarningEmail from "../../../utilities/lowStockWarningEmail";
import steedFastApi from "../../../utilities/steedfastApi";
import { CartItem } from "../../cartManagement/cartItem/cartItem.model";
import { Coupon } from "../../coupon/coupon.model";
import { TCourier } from "../../courier/courier.interface";
import { PaymentMethod } from "../../paymentMethod/paymentMethod.model";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import VariationModel from "../../productManagement/variation/variation.model";
import { Warranty } from "../../warrantyManagement/warranty/warranty.model";
import { TWarrantyClaimedProductDetails } from "../../warrantyManagement/warrantyClaim/warrantyClaim.interface";
import { TPaymentData } from "../orderPayment/orderPayment.interface";
import { OrderPayment } from "../orderPayment/orderPayment.model";
import { OrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.model";
import { TShipping, TShippingData } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { OrderHelper } from "./order.helper";
import {
  TCourierResponse,
  TOrder,
  TOrderSource,
  TOrderStatus,
  TProductDetails,
  TSanitizedOrProduct,
} from "./order.interface";
import { Order } from "./order.model";

export const createOrderId = () => {
  const date = new Date();
  const timestamp = date.getTime();
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  const randomLetters = "";
  const orderId = `${String(date.getFullYear()).slice(2)}${randomLetters}${date.getMonth() + 1}${date.getDate()}${randomNum}${String(timestamp).split("").reverse().join("")}`;
  return orderId.slice(0, 10);
};

// This function will increase or decrease stock quantity base on command. The first parameter will receive product details, the second parameter will receive mongoDB session and the third parameter will receive a boolean value. Base on the value the stock will increase od decrease

export type TUpStOnCanDelProducts = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  title: string;
  unitPrice: number;
  isWarrantyClaim: boolean;
  quantity: number;
  total: number;
  defaultInventory: {
    _id: Types.ObjectId;
    stockAvailable: number;
    manageStock: boolean;
    lowStockWarning: number;
  };
  variation: Types.ObjectId;
  variationDetails: {
    _id: Types.ObjectId;
    inventory: {
      stockAvailable: number;
      manageStock: boolean;
      lowStockWarning: number;
    };
  };
};

// This function can update the stock of canceled and deleted orders
export const updateStockOrderCancelDelete = async (
  productDetails: TUpStOnCanDelProducts[],
  session: mongoose.mongo.ClientSession,
  inc: boolean = true
) => {
  const variationMissingProducts = [];
  for (const item of productDetails) {
    let updateType = item.quantity;
    if (!inc) {
      updateType = -item.quantity;
    }
    if (item?.variation) {
      if (item?.variationDetails) {
        if (item?.variationDetails?.inventory?.manageStock) {
          await VariationModel.updateOne(
            {
              _id: item?.variation,
            },
            {
              $inc: {
                "inventory.stockAvailable": updateType,
              },
            }
          ).session(session);
        }
      } else {
        variationMissingProducts.push(item.title);
      }
    } else {
      if (item?.defaultInventory?.manageStock) {
        await InventoryModel.updateOne(
          { _id: item?.defaultInventory?._id },
          { $inc: { stockAvailable: updateType } }
        ).session(session);
      }
    }
  }
  if (variationMissingProducts.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Variation missing for ${variationMissingProducts.join(", ")}`
    );
  }
};

// This function will delete warranty information from warranty collection and update order product details
export const deleteWarrantyFromOrder = async (
  productDetails: TProductDetails[],
  orderId: Types.ObjectId,
  session: mongoose.mongo.ClientSession
) => {
  const deleteQuery = {
    _id: {
      $in: productDetails
        .map((item) => item.warranty)
        .map(
          (item) => new mongoose.Types.ObjectId(item as mongoose.Types.ObjectId)
        ),
    },
  };

  await Warranty.deleteMany(deleteQuery).session(session);
  await Order.updateOne(
    { _id: orderId, "productDetails.warranty": { $exists: true } },
    { $unset: { "productDetails.$.warranty": 1 } }
  ).session(session);
};

// create order
export const createNewOrder = async (
  payload: Record<string, unknown>,
  session: ClientSession,
  warrantyClaimOrderData?: {
    warrantyClaim?: boolean;
    productsDetails?:
      | Partial<TProductDetails[]>
      | TWarrantyClaimedProductDetails[];
  }
) => {
  const {
    payment,
    shipping,
    shippingCharge,
    orderNotes,
    orderedProducts,
    orderSource,
    custom,
    salesPage,
    coupon,
  } = payload.body as {
    payment: TPaymentData;
    shipping: TShippingData;
    shippingCharge: mongoose.Types.ObjectId;
    orderFrom: string;
    orderNotes: string;
    orderSource: TOrderSource;
    custom: boolean;
    salesPage: boolean;
    orderedProducts: TProductDetails[];
    coupon?: string;
  };

  let { courierNotes, officialNotes, invoiceNotes, advance, discount } =
    payload.body as {
      courierNotes?: string;
      officialNotes?: string;
      invoiceNotes?: string;
      advance?: number;
      discount?: number;
    };

  const status: TOrderStatus = warrantyClaimOrderData?.warrantyClaim
    ? "warranty processing"
    : "pending";
  const user = payload?.user as TOptionalAuthGuardPayload;
  const userQuery = optionalAuthUserQuery(user);

  userQuery.userId = userQuery.userId
    ? new Types.ObjectId(userQuery.userId)
    : undefined;

  let totalCost = 0;

  const orderData: Partial<TOrder> = {};
  let onlyProductsCosts = 0;
  const orderId = createOrderId();
  let orderedProductInfo: TSanitizedOrProduct[] = [];

  if (custom || warrantyClaimOrderData?.warrantyClaim) {
    if (!user.id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized request");
    }
    if (!["superAdmin", "admin", "staff"]?.includes(String(user?.role))) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Permission denied");
    }
  }
  let fromWebsite = false;
  if (custom) {
    userQuery.userId = undefined;
    orderedProductInfo =
      await OrderHelper.sanitizeOrderedProducts(orderedProducts);
  } else if (salesPage) {
    orderedProductInfo =
      await OrderHelper.sanitizeOrderedProducts(orderedProducts);
  } else if (
    warrantyClaimOrderData?.warrantyClaim &&
    warrantyClaimOrderData?.productsDetails
  ) {
    orderedProductInfo = await OrderHelper.sanitizeOrderedProducts(
      warrantyClaimOrderData?.productsDetails as TProductDetails[],
      true
    );
  } else {
    fromWebsite = true;
    const cart = await OrderHelper.sanitizeCartItemsForOrder(userQuery);
    orderedProductInfo = cart as unknown as TSanitizedOrProduct[];
  }
  if (config.env === "production") {
    if (salesPage || fromWebsite) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const orderCount = await Order.countDocuments({
        ...userQuery,
        createdAt: { $gte: oneHourAgo },
      });
      if (orderCount) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Reached order limit");
      }
    }
  }

  if (fromWebsite || salesPage) {
    courierNotes = undefined;
    officialNotes = undefined;
    invoiceNotes = undefined;
    advance = 0;
    discount = 0;
  }

  const { orderedProductData, cost } =
    OrderHelper.validateAndSanitizeOrderedProducts(orderedProductInfo);

  onlyProductsCosts = cost;

  // Execute DB operations after mapping
  await Promise.all(
    orderedProductData.map(async ({ item }) => {
      if (item?.product?.stock?.manageStock) {
        const currentStock =
          Number(item?.product?.stock?.stockAvailable || 0) - item.quantity;
        if (currentStock < item?.product?.stock?.lowStockWarning) {
          await lowStockWarningEmail({
            productName: item?.product?.title,
            currentStock,
            sku: item?.product?.stock?.sku,
          });
        }
        if (item.variation) {
          await VariationModel.updateOne(
            { _id: item.variation },
            { $inc: { "inventory.stockAvailable": -item.quantity } }
          ).session(session);
        } else {
          await InventoryModel.updateOne(
            { _id: item?.product?.defaultInventory },
            { $inc: { stockAvailable: -item.quantity } }
          ).session(session);
        }
      }
    })
  );

  // Extract results after DB operations are done
  const finalOrderedProductData = orderedProductData.map(
    ({ result }) => result
  );

  orderData.productDetails = finalOrderedProductData as TProductDetails[];

  const paymentMethod = await PaymentMethod.findById(payment.paymentMethod);
  if (!paymentMethod) {
    {
      throw new ApiError(httpStatus.BAD_REQUEST, "No payment found");
    }
  }
  if (paymentMethod?.isPaymentDetailsNeeded) {
    if (!payment.phoneNumber || !payment.transactionId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid request.");
    }
  }
  payment.orderId = orderId;
  orderData.payment = (
    await OrderPayment.create([payment], { session })
  )[0]._id;
  // Create Shipping data
  shipping.orderId = orderId;
  const isExistingShipping = await Shipping.findOne({
    phoneNumber: shipping.phoneNumber,
  });
  if (isExistingShipping) {
    await Shipping.findByIdAndUpdate(
      isExistingShipping._id,
      {
        $set: {
          fullName: shipping.fullName,
          fullAddress: shipping.fullAddress,
          // city: shipping.city,
          // state: shipping.state,
          // country: shipping.country,
          district: shipping.district,
          division: shipping.division,
          upazila: shipping.upazila,
        },
      },
      { session }
    );
    orderData.shipping = isExistingShipping._id;
  } else {
    orderData.shipping = (
      await Shipping.create([shipping], { session })
    )[0]._id;
  }
  // create status document
  orderData.statusHistory = (
    await OrderStatusHistory.create([{ orderId, history: [{ status }] }], {
      session,
    })
  )[0]._id;

  const {
    couponDiscount,
    totalCostAfterCoupon,
    shippingId,
    couponId,
    shippingChange,
  } = await OrderHelper.orderCostAfterCoupon(
    onlyProductsCosts,
    shippingCharge.toString(),
    orderedProductInfo,
    { couponCode: coupon, user }
  );

  if (couponId) {
    await Coupon.findByIdAndUpdate(
      couponId,
      { $inc: { usageCount: 1 } },
      { session }
    );
  }

  let warrantyAmount = 0;
  warrantyAmount = totalCostAfterCoupon;
  let totalCostAfterWarranty = totalCostAfterCoupon;

  if (!warrantyClaimOrderData?.warrantyClaim) {
    warrantyAmount = 0;
  } else {
    totalCostAfterWarranty += shippingChange;
  }

  totalCost =
    totalCostAfterWarranty -
    warrantyAmount -
    Number(advance || 0) -
    Number(discount || 0);

  orderData.orderId = orderId;
  orderData.userId =
    fromWebsite === true || salesPage === true
      ? (userQuery.userId as mongoose.Types.ObjectId)
      : undefined;
  orderData.sessionId =
    fromWebsite || salesPage ? (userQuery.sessionId as string) : undefined;
  orderData.subtotal = onlyProductsCosts;
  orderData.shippingCharge = shippingId;
  orderData.total = totalCost;
  orderData.warrantyAmount = warrantyAmount;
  orderData.status = status;
  orderData.couponDetails = couponId;
  orderData.couponDiscount = couponDiscount;

  orderData.orderNotes = orderNotes;
  orderData.courierNotes = courierNotes;
  orderData.officialNotes = officialNotes;
  orderData.invoiceNotes = invoiceNotes;
  orderData.userIp = payload.clientIp as string;
  orderData.orderSource = {
    name: orderSource?.name,
    url: orderSource?.url,
    lpNo: orderSource?.lpNo,
  };
  orderData.advance = advance;
  orderData.discount = discount;
  const [orderRes] = await Order.create([orderData], { session });
  if (!orderRes) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create order");
  }

  // clear cart and cart items
  if (fromWebsite) {
    await CartItem.deleteMany(userQuery).session(session);
  }

  await OrderHelper.sendOrderSMSNotification(
    { fullName: shipping.fullName, orderId, phoneNumber: shipping.phoneNumber },
    "order_created"
  );

  return orderRes;
};

type TOrderDataForCourier = {
  orderId: string;
  shippingData: TShipping;
  total: number;
  courierNotes: string;
};

// create order on 'steed fast' courier
export const createOrderOnSteedFast = async (
  orders: Partial<TOrder[]>,
  courier: TCourier
) => {
  const payload = (orders as unknown as TOrderDataForCourier[]).map(
    ({ orderId, shippingData, total, courierNotes }) => ({
      invoice: orderId,
      recipient_name: shippingData.fullName,
      recipient_address: shippingData.fullAddress,
      recipient_phone: shippingData.phoneNumber,
      cod_amount: total,
      note: courierNotes || "",
    })
  );

  const { data } = await steedFastApi({
    credentials: courier.credentials,
    endpoints: "/create_order/bulk-order",
    method: "POST",
    payload: payload as unknown as Record<string, string>[],
  });
  const sanitizedData = (data as TCourierResponse[]).map(
    ({ invoice, tracking_code, status }) => ({
      orderId: invoice,
      trackingId: tracking_code,
      status,
    })
  );

  return {
    success: sanitizedData.filter((item) => item.status === "success"),
    error: sanitizedData.filter((item) => item.status === "error"),
  };
};
