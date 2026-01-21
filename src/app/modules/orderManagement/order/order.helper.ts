import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import { errorLogger } from "../../../utilities/logger";
import sendMail from "../../../utilities/nodeMailerConfig";
import sendSms from "../../../utilities/sendSms";
import { Cart } from "../../cartManagement/cart/cart.model";
import { Coupon } from "../../coupon/coupon.model";
import { TCategory } from "../../productManagement/category/category.interface";
import { STOCK_STATUS } from "../../productManagement/inventory/inventory.const";
import { TInventory } from "../../productManagement/inventory/inventory.interface";
import { TPrice } from "../../productManagement/price/price.interface";
import { TProduct } from "../../productManagement/product/product.interface";
import ProductModel from "../../productManagement/product/product.model";
import { TVariation } from "../../productManagement/variation/variation.interface";
import {
  TOrderSMSNotification,
  TOrderSMSNotificationType,
} from "../../smsManagement/orderSMSNotification/orderSMSNotification.interface";
import { OrderSMSNotification } from "../../smsManagement/orderSMSNotification/orderSMSNotification.model";
import { TWarrantyClaimedProductDetails } from "../../warrantyManagement/warrantyClaim/warrantyClaim.interface";
import { ShippingCharge } from "../shippingCharge/shippingCharge.model";
import {
  TFindOrderForUpdatingOrder,
  TOrderedProduct,
  TOrderStatus,
  TSanitizedOrProduct,
  TSMSReceiverInfo,
} from "./order.interface";
import { Order } from "./order.model";

type TsnOrderProduct = TOrderedProduct[] | TWarrantyClaimedProductDetails[];

const sanitizeOrderedProducts = async (
  orderedProducts: TsnOrderProduct,
  isWarrantyClaim: boolean = false
): Promise<TSanitizedOrProduct[]> => {
  const data: TSanitizedOrProduct[] = [];
  for (const item of orderedProducts) {
    const product = await ProductModel.findOne(
      {
        _id: new mongoose.Types.ObjectId(String(item.product)),
      },
      {
        title: 1,
        price: 1,
        inventory: 1,
        variations: 1,
        category: 1,
        isDeleted: 1,
      }
    )
      .populate([
        {
          path: "variations",
          populate: [
            {
              path: "price",
            },
            {
              path: "inventory",
            },
          ],
        },
        { path: "price" },
        { path: "category.name" },
        { path: "inventory" },
      ])
      .lean();

    if (!product)
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to find product.");

    const findVariation = product?.variations?.filter(
      (variation) => variation?._id?.toString() === item?.variation?.toString()
    )[0] as TVariation;

    if (product?.variations?.length) {
      if (!item.variation) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Please provide valid variation for product - ${product.title}`
        );
      }
      if (!findVariation) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Variation not match for product - ${product.title}`
        );
      }
    }

    const sanitizedData = {
      product: {
        ...product,
        variationDetails: {
          variations: Object.keys(findVariation?.attributes || {})?.length
            ? [findVariation]
            : null,
        },
        price: (findVariation?.price || product?.price) as TPrice,
        stock: (findVariation?.inventory || product?.inventory) as TInventory,
        defaultInventory: product?.inventory?._id,
        variations: undefined,
        inventory: undefined,
        category: product?.category?.name as unknown as TCategory,
      },
      quantity: item.quantity,
      variation: item?.variation
        ? new Types.ObjectId(String(item?.variation))
        : undefined,
      attributes: isWarrantyClaim
        ? Object.keys(item.attributes || {})?.length
          ? item.attributes
          : undefined
        : undefined,
      isWarrantyClaim: isWarrantyClaim,
      claimedCodes: isWarrantyClaim
        ? item?.claimedCodes?.length
          ? item?.claimedCodes
          : undefined
        : undefined,
      prevWarrantyInformation: isWarrantyClaim
        ? item.prevWarrantyInformation
        : undefined,
      warrantyClaimHistory: item.warrantyClaimHistory as Types.ObjectId,
    };

    data.push(sanitizedData);
  }

  return data;
};

const findOrderForUpdatingOrder = async (
  id: Types.ObjectId
): Promise<TFindOrderForUpdatingOrder> => {
  const order = (
    await Order.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
        },
      },
      {
        $unwind: {
          path: "$orderedProducts",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "orderedProducts.product",
          foreignField: "_id",
          as: "orderedProducts.productInfo",
        },
      },
      {
        $unwind: {
          path: "$orderedProducts.productInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "images",
          localField: "orderedProducts.productInfo.image.thumbnail",
          foreignField: "_id",
          as: "orderedProducts.productInfo.productImage",
        },
      },
      {
        $unwind: {
          path: "$orderedProducts.productInfo.productImage",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "inventories",
          localField: "orderedProducts.productInfo.inventory",
          foreignField: "_id",
          as: "orderedProducts.productInfo.inventoryInfo",
        },
      },
      {
        $unwind: {
          path: "$orderedProducts.productInfo.inventoryInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "warranties",
          localField: "orderedProducts.warranty",
          foreignField: "_id",
          as: "productWarrantyDetails",
        },
      },
      {
        $unwind: {
          path: "$productWarrantyDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "shippingcharges",
          localField: "shippingCharge",
          foreignField: "_id",
          as: "shippingChargeInfo",
        },
      },
      {
        $unwind: {
          path: "$shippingChargeInfo",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "variations",
          localField: "orderedProducts.variation",
          foreignField: "_id",
          as: "variation",
        },
      },
      {
        $unwind: {
          path: "$variation",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "orderedProducts.productInfo.variations": {
            $cond: {
              if: { $isArray: "$orderedProducts.productInfo.variations" },
              then: "$orderedProducts.productInfo.variations",
              else: [],
            },
          },
        },
      },
      {
        $lookup: {
          from: "variations",
          localField: "orderedProducts.productInfo.variations",
          foreignField: "_id",
          as: "allVariations",
        },
      },
      {
        $group: {
          _id: "$_id",
          // Push product details only if a valid product exists (i.e. orderedProducts.product is not null)
          orderedProducts: {
            $push: {
              $cond: [
                { $ifNull: ["$orderedProducts.product", false] },
                {
                  _id: "$orderedProducts._id",
                  product: "$orderedProducts.product",
                  productTitle: "$orderedProducts.productInfo.title",
                  image: {
                    src: {
                      $concat: [
                        config.image_base_url,
                        "/",
                        "$orderedProducts.productInfo.productImage.src",
                      ],
                    },
                    alt: "$orderedProducts.productInfo.productImage.alt",
                  },
                  attributes: "$orderedProducts.attributes",
                  unitPrice: "$orderedProducts.unitPrice",
                  quantity: "$orderedProducts.quantity",
                  total: "$orderedProducts.total",
                  warranty: "$orderedProducts.warranty",
                  productWarrantyDetails: {
                    warrantyCodes: "$productWarrantyDetails.warrantyCodes",
                  },
                  isWarrantyClaim: "$orderedProducts.isWarrantyClaim",
                  claimedCodes: "$orderedProducts.claimedCodes",
                  variation: "$orderedProducts.variation",
                  variations: "$allVariations",
                  inventoryInfo: {
                    variationInventory: {
                      variation: "$variation._id",
                      stockStatus: "$variation.inventory.stockStatus",
                      stockAvailable: "$variation.inventory.stockAvailable",
                      manageStock: "$variation.inventory.manageStock",
                      lowStockWarning: "$variation.inventory.lowStockWarning",
                    },
                    defaultInventory: {
                      _id: "$orderedProducts.productInfo.inventoryInfo._id",
                      stockAvailable:
                        "$orderedProducts.productInfo.inventoryInfo.stockAvailable",
                      stockStatus:
                        "$orderedProducts.productInfo.inventoryInfo.stockStatus",
                      manageStock:
                        "$orderedProducts.productInfo.inventoryInfo.manageStock",
                      lowStockWarning:
                        "$orderedProducts.productInfo.inventoryInfo.lowStockWarning",
                    },
                  },
                },
                "$$REMOVE",
              ],
            },
          },
          couponDetails: { $first: "$couponDetails" },
          subtotal: { $first: "$subtotal" },
          tax: { $first: "$tax" },
          shippingCharge: {
            $first: {
              _id: "$shippingChargeInfo._id",
              amount: "$shippingChargeInfo.amount",
            },
          },
          discount: { $first: "$discount" },
          couponDiscount: { $first: "$couponDiscount" },
          shipping: { $first: "$shipping" },
          advance: { $first: "$advance" },
          warrantyAmount: { $first: "$warrantyAmount" },
          total: { $first: "$total" },
          payment: { $first: "$payment" },
          status: { $first: "$status" },
          deliveryStatus: { $first: "$deliveryStatus" },
        },
      },
    ])
  )[0] as TFindOrderForUpdatingOrder;

  return order;
};

const orderDetailsPipeline = (): PipelineStage[] => [
  {
    $lookup: {
      from: "shippings",
      localField: "shipping",
      foreignField: "_id",
      as: "shippingData",
    },
  },
  {
    $unwind: { path: "$shippingData", preserveNullAndEmptyArrays: true },
  },
  // {
  //   $lookup: {
  //     from: "divisions",
  //     localField: "shippingData.division",
  //     foreignField: "id",
  //     as: "shippingData.division",
  //   },
  // },
  // {
  //   $unwind: {
  //     path: "$shippingData.division",
  //     preserveNullAndEmptyArrays: true,
  //   },
  // },
  // {
  //   $lookup: {
  //     from: "districts",
  //     localField: "shippingData.district",
  //     foreignField: "id",
  //     as: "shippingData.district",
  //   },
  // },
  // {
  //   $unwind: {
  //     path: "$shippingData.district",
  //     preserveNullAndEmptyArrays: true,
  //   },
  // },
  {
    $lookup: {
      from: "shippingcharges",
      localField: "shippingCharge",
      foreignField: "_id",
      as: "shippingCharge",
    },
  },
  {
    $unwind: { path: "$shippingCharge", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "orderpayments",
      localField: "payment",
      foreignField: "_id",
      as: "payment",
    },
  },
  {
    $unwind: { path: "$payment", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "paymentmethods",
      localField: "payment.paymentMethod",
      foreignField: "_id",
      as: "paymentMethod",
    },
  },
  {
    $unwind: { path: "$paymentMethod", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "images",
      localField: "paymentMethod.image",
      foreignField: "_id",
      as: "paymentMethodImage",
    },
  },
  {
    $unwind: { path: "$paymentMethodImage", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "orderstatushistories",
      localField: "statusHistory",
      foreignField: "_id",
      as: "statusHistory",
    },
  },
  {
    $unwind: { path: "$statusHistory", preserveNullAndEmptyArrays: true },
  },
  {
    $project: {
      _id: 1,
      orderId: 1,
      subtotal: 1,
      total: 1,
      discount: 1,
      advance: 1,
      status: 1,
      shipping: {
        fullName: "$shippingData.fullName",
        phoneNumber: "$shippingData.phoneNumber",
        fullAddress: "$shippingData.fullAddress",
        district: "$shippingData.district",
        division: "$shippingData.division",
        upazila: "$shippingData.upazila",
        // division: {
        //   id: "$shippingData.division.id",
        //   name: "$shippingData.division.name",
        //   bn_name: "$shippingData.division.bn_name",
        // },
        // district: {
        //   id: "$shippingData.district.id",
        //   name: "$shippingData.district.name",
        //   bn_name: "$shippingData.district.bn_name",
        // },
      },
      shippingCharge: {
        _id: "$shippingCharge._id",
        name: "$shippingCharge.name",
        amount: "$shippingCharge.amount",
      },
      payment: {
        $cond: {
          if: { $not: ["$payment"] },
          then: null,
          else: {
            paymentMethod: {
              _id: "$paymentMethod._id",
              name: "$paymentMethod.name",
              image: {
                src: {
                  $concat: [
                    config.image_base_url,
                    "/",
                    "$paymentMethodImage.src",
                  ],
                },
                alt: "$paymentMethodImage.alt",
              },
            },
            phoneNumber: "$payment.phoneNumber",
            transactionId: "$payment.transactionId",
            paymentDetails: "$payment.paymentDetails",
          },
        },
      },
      statusHistory: {
        refunded: "$statusHistory.refunded",
        history: "$statusHistory.history",
      },
      officialNotes: 1,
      invoiceNotes: 1,
      monitoringNotes: 1,
      courierNotes: 1,
      orderNotes: 1,
      followUpDate: 1,
      orderSource: 1,
      orderedProducts: 1,
      deliveryStatus: 1,
      monitoringStatus: 1,
      trackingStatus: 1,
      reasonNotes: 1,
      createdAt: 1,
      courierDetails: 1,
    },
  },
  {
    $unwind: { path: "$orderedProducts", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "products",
      localField: "orderedProducts.product",
      foreignField: "_id",
      as: "productInfo",
    },
  },
  {
    $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "images",
      localField: "productInfo.image.thumbnail",
      foreignField: "_id",
      as: "productThumb",
    },
  },
  {
    $unwind: { path: "$productThumb", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "warranties",
      localField: "orderedProducts.warranty",
      foreignField: "_id",
      as: "warranty",
    },
  },
  {
    $addFields: {
      warranty: {
        $cond: {
          if: { $eq: [{ $size: "$warranty" }, 0] },
          then: null,
          else: { $arrayElemAt: ["$warranty", 0] },
        },
      },
    },
  },
  {
    $addFields: {
      product: {
        $cond: {
          if: { $not: ["$orderedProducts"] },
          then: null,
          else: {
            _id: "$orderedProducts._id",
            productId: "$productInfo._id",
            title: "$productInfo.title",
            slug: "$productInfo.slug",
            image: {
              src: {
                $concat: [config.image_base_url, "/", "$productThumb.src"],
              },
              alt: "$productThumb.alt",
            },
            unitPrice: "$orderedProducts.unitPrice",
            isWarrantyClaim: "$orderedProducts.isWarrantyClaim",
            claimedCodes: "$orderedProducts.claimedCodes",
            quantity: "$orderedProducts.quantity",
            total: "$orderedProducts.total",
            attributes: "$orderedProducts.attributes",
            variation: "$orderedProducts.variation",
            warranty: {
              _id: "$warranty._id",
              warrantyCodes: "$warranty.warrantyCodes",
              duration: "$warranty.duration",
              startDate: "$warranty.startDate",
              endsDate: "$warranty.endsDate",
              createdAt: "$warranty.createdAt",
            },
            isProductWarrantyAvailable: "$productInfo.warranty",
          },
        },
      },
    },
  },
  {
    $group: {
      _id: "$_id",
      orderId: { $first: "$orderId" },
      total: { $first: "$total" },
      subtotal: { $first: "$subtotal" },
      discount: { $first: "$discount" },
      advance: { $first: "$advance" },
      status: { $first: "$status" },
      deliveryStatus: { $first: "$deliveryStatus" },
      monitoringStatus: { $first: "$monitoringStatus" },
      trackingStatus: { $first: "$trackingStatus" },
      shipping: { $first: "$shipping" },
      payment: { $first: "$payment" },
      shippingCharge: { $first: "$shippingCharge" },
      officialNotes: { $first: "$officialNotes" },
      invoiceNotes: { $first: "$invoiceNotes" },
      monitoringNotes: { $first: "$monitoringNotes" },
      courierNotes: { $first: "$courierNotes" },
      reasonNotes: { $first: "$reasonNotes" },
      orderNotes: { $first: "$orderNotes" },
      followUpDate: { $first: "$followUpDate" },
      orderSource: { $first: "$orderSource" },
      statusHistory: { $first: "$statusHistory" },
      products: {
        $push: {
          $cond: {
            if: { $not: ["$product"] },
            then: "$$REMOVE",
            else: "$product",
          },
        },
      },
      createdAt: { $first: "$createdAt" },
    },
  },
  {
    $addFields: {
      products: {
        $cond: {
          if: { $eq: [{ $size: "$products" }, 0] },
          then: null,
          else: "$products",
        },
      },
    },
  },
];

const orderStatusUpdatingPipeline = (
  orderIds: Types.ObjectId[],
  changeableStatus: Partial<TOrderStatus[]>
) =>
  [
    {
      $match: {
        _id: {
          $in: orderIds.map((item) => new Types.ObjectId(item)),
        },
        status: { $in: changeableStatus },
      },
    },
    {
      $unwind: { path: "$orderedProducts", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "products",
        localField: "orderedProducts.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    {
      $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "images",
        localField: "productInfo.image.thumbnail",
        foreignField: "_id",
        as: "productThumb",
      },
    },
    {
      $unwind: { path: "$productThumb", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "inventories",
        localField: "productInfo.inventory",
        foreignField: "_id",
        as: "defaultInventoryData",
      },
    },
    {
      $unwind: "$defaultInventoryData",
    },

    {
      $lookup: {
        from: "shippings",
        localField: "shipping",
        foreignField: "_id",
        as: "shippingInfo",
      },
    },
    {
      $unwind: "$shippingInfo",
    },
    // {
    //   $addFields: {
    //     variation: {
    //       $arrayElemAt: [
    //         {
    //           $filter: {
    //             input: "$productInfo.variations",
    //             as: "variation",
    //             cond: {
    //               $eq: ["$$variation._id", "$orderedProducts.variation"],
    //             },
    //           },
    //         },
    //         0,
    //       ],
    //     },
    //   },
    // },
    {
      $lookup: {
        from: "variations",
        localField: "orderedProducts.variation",
        foreignField: "_id",
        as: "variationData",
      },
    },
    {
      $unwind: {
        path: "$variationData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "inventories",
        localField: "variationData.inventory",
        foreignField: "_id",
        as: "variationInventoryData",
      },
    },
    {
      $unwind: {
        path: "$variationInventoryData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        product: {
          $cond: {
            if: { $not: ["$orderedProducts"] },
            then: null,
            else: {
              _id: "$orderedProducts._id",
              productId: "$productInfo._id",
              title: "$productInfo.title",
              image: {
                src: {
                  $concat: [config.image_base_url, "/", "$productThumb.src"],
                },
                alt: "$productThumb.alt",
              },
              unitPrice: "$orderedProducts.unitPrice",
              isWarrantyClaim: "$orderedProducts.isWarrantyClaim",
              warranty: "$orderedProducts.warranty",
              productWarranty: "$productInfo.warranty",
              quantity: "$orderedProducts.quantity",
              variation: "$variationData",
              total: "$orderedProducts.total",
              defaultInventory: {
                _id: "$defaultInventoryData._id",
                stockAvailable: "$defaultInventoryData.stockAvailable",
                manageStock: "$defaultInventoryData.manageStock",
                lowStockWarning: "$defaultInventoryData.lowStockWarning",
              },
              variationDetails: {
                _id: "$variationData._id",
                inventory: {
                  _id: "$variationInventoryData._id",
                  stockAvailable: "$variationInventoryData.stockAvailable",
                  manageStock: "$variationInventoryData.manageStock",
                  lowStockWarning: "$variationInventoryData.lowStockWarning",
                },
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        orderId: { $first: "$orderId" },
        statusHistory: { $first: "$statusHistory" },
        status: { $first: "$status" },
        total: { $first: "$total" },
        shippingData: { $first: "$shippingInfo" },
        courierNotes: { $first: "$courierNotes" },
        orderedProducts: {
          $push: {
            $cond: {
              if: { $not: ["$product"] },
              then: "$$REMOVE",
              else: "$product",
            },
          },
        },
      },
    },
    {
      $addFields: {
        orderedProducts: {
          $cond: {
            if: { $eq: [{ $size: "$orderedProducts" }, 0] },
            then: null,
            else: "$orderedProducts",
          },
        },
      },
    },
  ] as PipelineStage[];
const orderDetailsCustomerPipeline = (): PipelineStage[] => [
  {
    $lookup: {
      from: "shippings",
      localField: "shipping",
      foreignField: "_id",
      as: "shippingData",
    },
  },
  {
    $unwind: { path: "$shippingData", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "shippingcharges",
      localField: "shippingCharge",
      foreignField: "_id",
      as: "shippingCharge",
    },
  },
  {
    $unwind: { path: "$shippingCharge", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "orderpayments",
      localField: "payment",
      foreignField: "_id",
      as: "payment",
    },
  },
  {
    $unwind: { path: "$payment", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "paymentmethods",
      localField: "payment.paymentMethod",
      foreignField: "_id",
      as: "paymentMethod",
    },
  },
  {
    $unwind: { path: "$paymentMethod", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "images",
      localField: "paymentMethod.image",
      foreignField: "_id",
      as: "paymentMethodImage",
    },
  },
  {
    $unwind: { path: "$paymentMethodImage", preserveNullAndEmptyArrays: true },
  },
  {
    $project: {
      _id: 1,
      orderId: 1,
      subtotal: 1,
      total: 1,
      discount: 1,
      advance: 1,
      status: 1,
      shipping: {
        fullName: "$shippingData.fullName",
        phoneNumber: "$shippingData.phoneNumber",
        fullAddress: "$shippingData.fullAddress",
      },
      shippingCharge: {
        name: "$shippingCharge.name",
        amount: "$shippingCharge.amount",
      },
      payment: {
        paymentMethod: {
          name: "$paymentMethod.name",
          image: {
            src: {
              $concat: [config.image_base_url, "/", "$paymentMethodImage.src"],
            },
            alt: "$paymentMethodImage.alt",
          },
        },
        phoneNumber: "$payment.phoneNumber",
        transactionId: "$payment.transactionId",
      },
      orderNotes: 1,
      followUpDate: 1,
      orderedProducts: 1,
      createdAt: 1,
    },
  },
  {
    $unwind: { path: "$orderedProducts", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "products",
      localField: "orderedProducts.product",
      foreignField: "_id",
      as: "productInfo",
    },
  },
  {
    $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "images",
      localField: "productInfo.image.thumbnail",
      foreignField: "_id",
      as: "productThumb",
    },
  },
  {
    $unwind: { path: "$productThumb", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "variations",
      localField: "orderedProducts.variation",
      foreignField: "_id",
      as: "variation",
    },
  },
  {
    $unwind: { path: "$variation", preserveNullAndEmptyArrays: true },
  },
  {
    $addFields: {
      product: {
        $cond: {
          if: { $not: ["$orderedProducts"] },
          then: null,
          else: {
            _id: "$orderedProducts._id",
            productId: "$productInfo._id",
            title: "$productInfo.title",
            slug: "$productInfo.slug",
            image: {
              src: {
                $concat: [config.image_base_url, "/", "$productThumb.src"],
              },
              alt: "$productThumb.alt",
            },
            unitPrice: "$orderedProducts.unitPrice",
            isWarrantyClaim: "$orderedProducts.isWarrantyClaim",
            claimedCodes: "$orderedProducts.claimedCodes",
            quantity: "$orderedProducts.quantity",
            total: "$orderedProducts.total",
            variation: {
              $cond: {
                if: {
                  $and: [
                    { $isArray: "$productInfo.variations" },
                    { $gt: [{ $size: "$productInfo.variations" }, 0] },
                  ],
                },
                then: {
                  _id: "$variation._id",
                  attributes: "$variation.attributes",
                  price: {
                    regularPrice: "$variation.price.regularPrice",
                    salePrice: "$variation.price.salePrice",
                    discountPercent: "$variation.price.discountPercent",
                  },
                },
                else: null,
              },
            },
          },
        },
      },
    },
  },
  {
    $group: {
      _id: "$_id",
      orderId: { $first: "$orderId" },
      total: { $first: "$total" },
      subtotal: { $first: "$subtotal" },
      discount: { $first: "$discount" },
      advance: { $first: "$advance" },
      status: { $first: "$status" },
      shipping: { $first: "$shipping" },
      payment: { $first: "$payment" },
      shippingCharge: { $first: "$shippingCharge" },
      orderNotes: { $first: "$orderNotes" },
      followUpDate: { $first: "$followUpDate" },
      orderSource: { $first: "$orderSource" },
      products: {
        $push: {
          $cond: {
            if: { $not: ["$product"] },
            then: "$$REMOVE",
            else: "$product",
          },
        },
      },
      createdAt: { $first: "$createdAt" },
    },
  },
  {
    $addFields: {
      products: {
        $cond: {
          if: { $eq: [{ $size: "$products" }, 0] },
          then: null,
          else: "$products",
        },
      },
    },
  },
];

const sanitizeCartsForOrder = async (userQuery: {
  userId?: Types.ObjectId;
  sessionId?: string;
}) => {
  const result = await Cart.find(userQuery, {}).populate([
    {
      path: "product",
      select: "_id title price isDeleted category.name inventory",
      populate: [
        {
          path: "price",
        },
        {
          path: "category.name",
        },
        {
          path: "inventory",
        },
      ],
    },
    {
      path: "variation",
      populate: [
        {
          path: "price",
        },
        {
          path: "inventory",
        },
      ],
    },
  ]);

  const cart = result?.map((item) => {
    const product = item?.product as TProduct;
    const variation = item?.variation as TVariation;
    const price = product?.price as TPrice;
    const category = product?.category.name;
    const inventory = product?.inventory as TInventory;
    const data = {
      product: {
        _id: product?._id,
        title: product?.title,
        price: {
          regularPrice: (variation?.price as TPrice)?.regularPrice
            ? (variation?.price as TPrice)?.regularPrice
            : price?.regularPrice,
          salePrice: (variation?.price as TPrice)?.salePrice
            ? (variation?.price as TPrice)?.salePrice
            : price?.salePrice,
          discountPercent: (variation?.price as TPrice)?.discountPercent
            ? (variation?.price as TPrice)?.discountPercent
            : price?.discountPercent,
          priceSave: (variation?.price as TPrice)?.priceSave
            ? (variation?.price as TPrice)?.priceSave
            : price?.priceSave,
        },
        category,
        isDeleted: product?.isDeleted,
        variationDetails: Object.keys(variation || {})?.length
          ? { variations: [variation] }
          : undefined,
        stock: Object.keys(variation || {}).length
          ? (variation?.inventory as TInventory)
          : inventory,
        defaultInventory: inventory?._id,
      },
      variation: item?.variation?._id,
      attributes: variation?.attributes,
      quantity: item?.quantity,
      _id: item?._id,
    };

    return data;
  });

  if (!cart.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No item found on cart");
  }
  return cart;
};

const validateAndSanitizeOrderedProducts = (
  productInfo: TSanitizedOrProduct[]
) => {
  let onlyProductsCosts = 0;
  const orderedProductData = productInfo?.map((item) => {
    let attributes;
    if (item.isWarrantyClaim) {
      attributes = item?.attributes;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attributes = (item.product as any)?.variationDetails?.variations
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item.product as any)?.variationDetails?.variations![0]?.attributes
        : undefined;
    }

    if (item.variation && item.product.isVariationAvailable === false) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `On product ${item?.product?.title}, selected variation is no longer available.`
      );
    }

    if (item.product.isDeleted) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `The product '${item.product.title}' is no longer available`
      );
    }

    if (
      (item?.product?.stock?.manageStock &&
        Number(item?.product?.stock?.stockAvailable || 0) < item?.quantity) ||
      item?.product?.stock?.stockStatus === STOCK_STATUS.OUT_OF_STOCK
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `The product '${item.product.title}' is 'Out of stock', please contact the support team`
      );
    }

    const price = Number(
      item?.product?.price?.salePrice || item?.product?.price?.regularPrice
    );

    const result = {
      product: item?.product?._id,
      unitPrice: price,
      quantity: item?.quantity,
      total: Math.round(item?.quantity * price),
      isWarrantyClaim: item?.isWarrantyClaim,
      claimedCodes: item?.claimedCodes,
      prevWarrantyInformation: item?.prevWarrantyInformation,
      variation: item?.variation,
      attributes,
      warrantyClaimHistory: item?.warrantyClaimHistory,
    };

    onlyProductsCosts += result.total;

    return {
      item,
      result,
    };
  });
  return { orderedProductData, cost: onlyProductsCosts };
};

const orderCostAfterCoupon = async (
  productCosts: number,
  shippingCharge: string,
  orderedProductInfo: TSanitizedOrProduct[],
  {
    couponCode,
    user,
  }: {
    couponCode?: string;
    user: TOptionalAuthGuardPayload;
  }
) => {
  const totalNumberOfItems = orderedProductInfo?.reduce((acc, item) => {
    return acc + item?.quantity;
  }, 0);

  // Find shipping change
  const shippingCharges = await ShippingCharge.findOne({
    _id: shippingCharge,
    isActive: true,
  });

  if (!shippingCharges) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No shipping charges found");
  }

  let couponDiscount = 0;
  let coupon;
  /********************************
   * Coupon calculation starts here
   *********************************/
  if (couponCode) {
    coupon = await Coupon.findOne({
      code: couponCode,
      isActive: true,
      isDeleted: false,
      startDate: { $lt: new Date(Date.now()) },
      endDate: { $gt: new Date(Date.now()) },
    });

    if (!coupon) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Coupon is not valid!");
    }

    const {
      allowedUsers,
      onlyForRegisteredUsers,
      fixedCategories,
      fixedProducts,
      restrictedCategories,
      usageLimit,
      usageCount,
      discountType,
      discountValue,
      maxDiscount,
    } = coupon;

    if (usageLimit) {
      if ((usageCount || 0) >= usageLimit) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `The applied coupon reached it's usage limit!`
        );
      }
    }

    // If the coupon needs to keep log in
    if (onlyForRegisteredUsers) {
      if (!user.id) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "To grab this offer, you must log in."
        );
      }
    }

    // If the coupon for specific users
    if (allowedUsers?.length) {
      const isUserAllowed = allowedUsers.find(
        (allowedUser) => allowedUser.toString() === user.id?.toString()
      );

      if (!isUserAllowed) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `You are not listed to use this coupon!`
        );
      }
    }

    let conditionedCost = 0;

    // If the coupon only for listed categories
    if (fixedCategories?.length) {
      const filteredProducts = orderedProductInfo.filter((item) => {
        if (
          fixedCategories
            ?.map((item) => item.toString())
            ?.includes(item?.product?.category?._id?.toString() || "")
        ) {
          return item;
        }
      });

      conditionedCost = filteredProducts.reduce((prev, current) => {
        const totalPrice =
          Number(
            current?.product?.price?.salePrice ||
              current?.product?.price?.regularPrice
          ) * current?.quantity || 0;
        return prev + totalPrice;
      }, 0);
    }

    // If the coupon except for listed categories
    if (restrictedCategories?.length) {
      const filteredProducts = orderedProductInfo.filter((item) => {
        if (
          !restrictedCategories
            ?.map((item) => item.toString())
            ?.includes(item?.product?.category?._id?.toString() || "")
        ) {
          return item;
        }
      });

      conditionedCost = filteredProducts.reduce((prev, current) => {
        const totalPrice =
          Number(
            current?.product?.price?.salePrice ||
              current?.product?.price?.regularPrice
          ) * current?.quantity || 0;
        return prev + totalPrice;
      }, 0);
    }
    // If the coupon only for listed products
    if (fixedProducts?.length) {
      const filteredProducts = orderedProductInfo.filter((item) => {
        if (
          fixedProducts
            ?.map((item) => item.toString())
            ?.includes(item?.product?._id.toString() || "")
        ) {
          return item;
        }
      });

      conditionedCost = filteredProducts.reduce((prev, current) => {
        const totalPrice =
          Number(
            current?.product?.price?.salePrice ||
              current?.product?.price?.regularPrice
          ) * current?.quantity || 0;
        return prev + totalPrice;
      }, 0);
    }

    // if (
    //   fixedCategories?.length ||
    //   restrictedCategories?.length ||
    //   fixedProducts?.length
    //   // eslint-disable-next-line no-empty
    // ) {
    // } else {
    //   conditionedCost = productCosts;
    // }

    if (
      ![fixedCategories, restrictedCategories, fixedProducts].some(
        (arr) => arr?.length
      )
    ) {
      conditionedCost = productCosts;
    }

    if (
      coupon?.minimumOrderValue &&
      coupon?.minimumOrderValue >= conditionedCost
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `You must spend ${coupon?.minimumOrderValue} or higher from the listed coupon conditions category and products!`
      );
    }

    // calculate coupon discount
    if (discountType === "percentage") {
      const calc = discountValue / 100;
      couponDiscount = conditionedCost * calc;

      if (maxDiscount) {
        if (couponDiscount > maxDiscount) {
          couponDiscount = maxDiscount;
        }
      }
    } else if (discountType === "flat") {
      couponDiscount = discountValue;
    }
  }

  /********************************
   * Coupon calculation ends here
   *********************************/
  const shippingCostExceptFirstItem =
    (totalNumberOfItems - 1) * config.per_item_shipping_cost;

  const shippingCostTotal =
    Number(shippingCharges?.amount) + shippingCostExceptFirstItem;

  const totalCostAfterCoupon =
    productCosts + shippingCostTotal - couponDiscount;

  return {
    couponDiscount,
    totalCostAfterCoupon,
    shippingId: shippingCharges._id,
    shippingChange: shippingCostTotal,
    couponId: coupon?._id,
  };
};

const sendOrderSMSNotification = async (
  receiverInfo: TSMSReceiverInfo,
  type?: TOrderSMSNotificationType,
  notificationData?: TOrderSMSNotification
) => {
  let SMSNotificationData = notificationData;

  if (!Object.keys(SMSNotificationData || {}).length) {
    SMSNotificationData = (await OrderSMSNotification.findOne({
      slug: type,
    })) as TOrderSMSNotification;
  }

  if (!SMSNotificationData?.activeMedium?.length) return false;

  if (!SMSNotificationData) return false;
  if (SMSNotificationData?.isActive === false) return false;
  if (!receiverInfo.phoneNumber) return false;
  if (!type) return false;

  const SMSTemplate = SMSNotificationData?.customTemplate;

  let SMSBody = SMSNotificationData.defaultTemplate;

  if (SMSTemplate) {
    SMSBody = SMSTemplate.replace(/{(\w+)}/g, (_, key: string) => {
      if (key === "break") return "\n"; // handle line break
      if (key === "trackingUrl")
        return `${config.order_tracking_url}/${receiverInfo.orderId}`; // handle line break
      return receiverInfo[key as keyof typeof receiverInfo] || "";
    });
  }

  try {
    if (SMSNotificationData?.activeMedium?.includes("phone")) {
      await sendSms([receiverInfo.phoneNumber], SMSBody, "T");
    }

    if (SMSNotificationData?.activeMedium?.includes("email")) {
      if (!receiverInfo.email) {
        return false;
      }

      await sendMail({
        to: [receiverInfo.email],
        subject: SMSNotificationData?.emailSubject || "Order Notification",
        html: SMSBody,
      });
    }
  } catch (error) {
    errorLogger.error("failed to send SMS", error);
    return false;
  }
  return true;
};

export const OrderHelper = {
  sanitizeOrderedProducts,
  findOrderForUpdatingOrder,
  orderDetailsPipeline,
  orderStatusUpdatingPipeline,
  orderDetailsCustomerPipeline,
  sanitizeCartsForOrder,
  validateAndSanitizeOrderedProducts,
  orderCostAfterCoupon,
  sendOrderSMSNotification,
};
