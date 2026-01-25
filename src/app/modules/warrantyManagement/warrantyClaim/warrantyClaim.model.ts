import mongoose, { Schema, model } from "mongoose";
import { ShippingSchema } from "../../orderManagement/shipping/shipping.model";
import {
  warrantyApprovalStatus,
  warrantyClaimedContactStatus,
  warrantyClaimedProductCondition,
} from "./warrantyClaim.const";
import { TWarrantyClaim } from "./warrantyClaim.interface";

const WarrantyCLaimSchema = new Schema<TWarrantyClaim>(
  {
    reqId: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    shipping: ShippingSchema,
    problemInDetails: {
      type: String,
      required: true,
    },
    videosAndImages: {
      type: [
        {
          path: {
            type: String,
          },
          fileType: {
            type: String,
          },
        },
      ],
    },
    warrantyClaimReqData: {
      type: [
        {
          order_id: {
            type: mongoose.Types.ObjectId,
            required: true,
          },
          orderItemId: {
            type: mongoose.Types.ObjectId,
            required: true,
          },
          variation: {
            type: Schema.ObjectId,
          },
          productId: {
            type: mongoose.Types.ObjectId,
            required: true,
          },
          claimedCodes: {
            type: [String],
            required: true,
          },
          attributes: {
            type: Map,
            of: String,
          },
          warrantyClaimHistory: {
            type: Schema.ObjectId,
          },
          prevWarrantyInformation: {
            duration: {
              quantity: {
                type: String,
              },
              unit: {
                type: String,
              },
            },
            startDate: {
              type: String,
            },
            endsDate: {
              type: String,
            },
          },
        },
      ],
      required: true,
    },
    officialNotes: {
      type: String,
    },
    contactStatus: {
      type: String,
      enum: warrantyClaimedContactStatus,
      default: "pending",
    },
    identifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    result: {
      type: String,
      enum: warrantyClaimedProductCondition,
      default: "pending",
    },
    approvalStatus: {
      type: String,
      enum: warrantyApprovalStatus,
    },
    finalCheckedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  { timestamps: true }
);

export const WarrantyClaim = model<TWarrantyClaim>(
  "WarrantyClaim",
  WarrantyCLaimSchema
);
