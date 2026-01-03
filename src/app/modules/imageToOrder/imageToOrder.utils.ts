import { PipelineStage } from "mongoose";
import config from "../../config/config";
import { createOrderId } from "../orderManagement/order/order.utils";

const createReqId = () => createOrderId();

const getRequestPipeline = (): PipelineStage[] => [
  {
    $project: {
      _id: 1,
      reqId: 1,
      shipping: {
        fullName: 1,
        phoneNumber: 1,
        fullAddress: 1,
      },
      images: {
        $map: {
          input: "$images",
          as: "image",
          in: { $concat: [config.image_base_url, "/", "$$image.path"] },
        },
      },
      contactStatus: 1,
      customerNotes: 1,
      status: 1,
      createdAt: 1,
    },
  },
];

export const ImageToOrderUtils = {
  createReqId,
  getRequestPipeline,
};
