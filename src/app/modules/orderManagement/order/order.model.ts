import mongoose, { Schema, model } from "mongoose";
import { orderSources, orderStatus } from "./order.const";
import { TCourierDetails, TOrder, TProductDetails } from "./order.interface";

const ProductDetailsSchema = new Schema<TProductDetails>({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  variation: {
    type: Schema.Types.ObjectId,
    ref: "Variation",
  },
  attributes: {
    type: Map,
    of: String,
  },
  unitPrice: {
    type: Number,
    require: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  warranty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warranty",
  },
  isWarrantyClaim: Boolean,
  warrantyClaimHistory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "warranty_claim_histories",
  },
  claimedCodes: {
    type: [
      {
        code: {
          type: String,
        },
      },
    ],
    default: undefined,
  },
  prevWarrantyInformation: {
    duration: {
      type: String,
    },
    startDate: {
      type: String,
    },
    endsDate: {
      type: String,
    },
  },
});

const CourierDetailsSchema = new Schema<TCourierDetails>(
  {
    courierProvider: {
      type: mongoose.Schema.Types.ObjectId,
    },
    trackingId: {
      type: String,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<TOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sessionId: {
      type: String,
    },
    productDetails: [ProductDetailsSchema],
    couponDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
    },
    shippingCharge: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "ShippingCharge",
    },
    discount: {
      type: Number,
      default: 0,
    },
    advance: {
      type: Number,
      default: 0,
    },
    warrantyAmount: {
      type: Number,
    },
    total: {
      type: Number,
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderPayment",
      required: true,
    },
    statusHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderStatusHistory",
      required: true,
    },
    status: {
      type: String,
      enum: orderStatus,
      required: true,
    },
    deliveryStatus: {
      type: String,
    },
    monitoringStatus: {
      type: String,
      enum: ["monitoring", "not monitoring", "low warning", "high warning"],
      default: "not monitoring",
    },
    trackingStatus: {
      type: String,
      enum: ["not contacted", "contact again", "completed today"],
      default: "not contacted",
    },
    followUpDate: {
      type: String,
    },
    shipping: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipping",
      required: true,
    },
    userIp: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    orderNotes: {
      type: String,
    },
    officialNotes: {
      type: String,
    },
    invoiceNotes: {
      type: String,
    },
    courierNotes: {
      type: String,
    },
    reasonNotes: {
      type: String,
    },
    monitoringNotes: {
      type: String,
    },
    courierDetails: CourierDetailsSchema,
    orderSource: {
      name: {
        type: String,
        enum: orderSources,
      },
      url: {
        type: String,
      },
      lpNo: {
        type: String,
      },
    },
    division: {
      type: String,
    },
    district: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = model<TOrder>("Order", OrderSchema);
