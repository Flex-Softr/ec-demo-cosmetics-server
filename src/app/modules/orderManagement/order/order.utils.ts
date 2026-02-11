import httpStatus from "http-status";
import mongoose, { ClientSession, Types } from "mongoose";
// import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import BdAddress from "../../../utilities/bdAddress/bdAddress";
import lowStockWarningEmail from "../../../utilities/lowStockWarningEmail";
import steedFastApi from "../../../utilities/steedfastApi";
import { Cart } from "../../cartManagement/cart/cart.model";
import { Coupon } from "../../coupon/coupon.model";
import { TCourier } from "../../courier/courier.interface";
import { PaymentMethod } from "../../paymentMethod/paymentMethod.model";
import { STOCK_STATUS } from "../../productManagement/inventory/inventory.const";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import { calculateStockStatus } from "../../productManagement/inventory/inventory.utils";
import { ROLES } from "../../userManagement/user/user.const";
import { Warranty } from "../../warrantyManagement/warranty/warranty.model";
import { TWarrantyClaimedOrderedProducts } from "../../warrantyManagement/warrantyClaim/warrantyClaim.interface";
import { TPaymentData } from "../orderPayment/orderPayment.interface";
import { OrderPayment } from "../orderPayment/orderPayment.model";
import { OrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.model";
import { TShipping, TShippingData } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { OrderHelper } from "./order.helper";
import {
  TCourierResponse,
  TOrder,
  TOrderedProduct,
  TOrderSource,
  TOrderStatus,
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
      _id: Types.ObjectId;
      stockAvailable: number;
      manageStock: boolean;
      lowStockWarning: number;
    };
  };
};

// This function can update the stock of canceled and deleted orders
export const updateStockOrderCancelDelete = async (
  orderedProducts: TUpStOnCanDelProducts[],
  session: mongoose.mongo.ClientSession,
  inc: boolean = true
) => {
  const variationMissingProducts = [];
  for (const item of orderedProducts) {
    let updateType = item.quantity;
    if (!inc) {
      updateType = -item.quantity;
    }
    if (item?.variation) {
      if (item?.variationDetails) {
        if (item?.variationDetails?.inventory?.manageStock) {
          const currentStock =
            item?.variationDetails?.inventory?.stockAvailable;
          const lowStockWarning =
            item?.variationDetails?.inventory?.lowStockWarning;
          const newStock = currentStock + updateType;

          const status = calculateStockStatus(newStock, lowStockWarning);

          await InventoryModel.updateOne(
            {
              _id: item?.variationDetails?.inventory?._id,
            },
            {
              $inc: {
                stockAvailable: updateType,
              },
              $set: {
                stockStatus: status,
              },
            }
          ).session(session);
        }
      } else {
        variationMissingProducts.push(item.title);
      }
    } else {
      if (item?.defaultInventory?.manageStock) {
        const currentStock = item?.defaultInventory?.stockAvailable;
        const lowStockWarning = item?.defaultInventory?.lowStockWarning;
        const newStock = currentStock + updateType;

        const status = calculateStockStatus(newStock, lowStockWarning);

        await InventoryModel.updateOne(
          { _id: item?.defaultInventory?._id },
          {
            $inc: { stockAvailable: updateType },
            $set: { stockStatus: status },
          }
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
  orderedProducts: TOrderedProduct[],
  orderId: Types.ObjectId,
  session: mongoose.mongo.ClientSession
) => {
  const deleteQuery = {
    _id: {
      $in: orderedProducts
        .map((item) => item.warranty)
        .map(
          (item) => new mongoose.Types.ObjectId(item as mongoose.Types.ObjectId)
        ),
    },
  };

  await Warranty.deleteMany(deleteQuery).session(session);
  await Order.updateOne(
    { _id: orderId, "orderedProducts.warranty": { $exists: true } },
    { $unset: { "orderedProducts.$.warranty": 1 } }
  ).session(session);
};

// create order
export const createNewOrder = async (
  payload: Record<string, unknown>,
  session: ClientSession,
  warrantyClaimOrderData?: {
    warrantyClaim?: boolean;
    orderedProducts?:
      | Partial<TOrderedProduct[]>
      | TWarrantyClaimedOrderedProducts[];
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
    orderedProducts: TOrderedProduct[];
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
    if (
      !([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] as string[])?.includes(
        String(user?.role)
      )
    ) {
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
    warrantyClaimOrderData?.orderedProducts
  ) {
    orderedProductInfo = await OrderHelper.sanitizeOrderedProducts(
      warrantyClaimOrderData?.orderedProducts as TOrderedProduct[],
      true
    );
  } else {
    fromWebsite = true;
    const cart = await OrderHelper.sanitizeCartsForOrder(userQuery);
    orderedProductInfo = cart as unknown as TSanitizedOrProduct[];
  }
  // if (config.env === "production") {
  //   if (salesPage || fromWebsite) {
  //     const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  //     const orderCount = await Order.countDocuments({
  //       ...userQuery,
  //       createdAt: { $gte: oneHourAgo },
  //     });
  //     if (orderCount) {
  //       throw new ApiError(httpStatus.BAD_REQUEST, "Reached order limit");
  //     }
  //   }
  // }

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
  for (const { item } of orderedProductData) {
    if (item?.product?.stock?.manageStock) {
      const inventoryId = item.variation
        ? item?.product?.stock?._id
        : item?.product?.defaultInventory;

      // Atomic stock deduction
      const result = await InventoryModel.updateOne(
        {
          _id: inventoryId,
          stockAvailable: { $gte: item.quantity },
          stockStatus: { $ne: STOCK_STATUS.OUT_OF_STOCK },
        },
        {
          $inc: { stockAvailable: -item.quantity },
        }
      ).session(session);

      if (result.modifiedCount === 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `The product '${item.product.title}' is either out of stock or insufficient stock. Please try again.`
        );
      }

      // Fetch the updated inventory to set the correct status
      const updatedInventory =
        await InventoryModel.findById(inventoryId).session(session);

      if (updatedInventory) {
        const newStatus = calculateStockStatus(
          updatedInventory.stockAvailable || 0,
          updatedInventory.lowStockWarning || 0
        );

        await InventoryModel.updateOne(
          { _id: inventoryId },
          { $set: { stockStatus: newStatus } }
        ).session(session);

        if (
          (updatedInventory.stockAvailable || 0) <
          (updatedInventory.lowStockWarning || 0)
        ) {
          await lowStockWarningEmail({
            productName: item?.product?.title,
            currentStock: updatedInventory.stockAvailable || 0,
            sku: updatedInventory.sku || "",
          });
        }
      }
    }
  }

  // Extract results after DB operations are done
  const finalOrderedProductData = orderedProductData.map(
    ({ result }) => result
  );

  orderData.orderedProducts = finalOrderedProductData as TOrderedProduct[];

  const paymentMethod = await PaymentMethod.findById(payment.paymentMethod);
  if (!paymentMethod) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No payment found");
  }

  if (paymentMethod?.required_inputs?.length > 0) {
    const requiredInputs = paymentMethod.required_inputs;
    for (const input of requiredInputs) {
      if (input.is_required) {
        const valueInDetails = payment.paymentDetails?.[input.name];

        if (!valueInDetails) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `${input.name} is required for ${paymentMethod.name}`
          );
        }
      }
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
          email: shipping.email,
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
    await Cart.deleteMany(userQuery).session(session);
  }

  await OrderHelper.sendOrderSMSNotification(
    {
      fullName: shipping.fullName,
      orderId,
      phoneNumber: shipping.phoneNumber,
      email: shipping.email,
      total: totalCost.toString(),
    },
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
      recipient_address:
        shippingData.fullAddress +
        "" +
        BdAddress.upazilaNameById(shippingData.upazila) +
        "" +
        BdAddress.districtNameById(shippingData.district),
      recipient_phone: shippingData.phoneNumber,
      cod_amount: total,
      note: courierNotes || "",
    })
  );

  const { data } = await steedFastApi({
    credentials: courier?.credentials || [],
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
