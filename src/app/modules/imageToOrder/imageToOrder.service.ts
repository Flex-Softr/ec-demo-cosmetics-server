import { Request } from "express";
import fsEx from "fs-extra";
import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import path from "path";
import ApiError from "../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../types/common";
import optionalAuthUserQuery from "../../types/optionalAuthUserQuery";
import { createNewOrder } from "../orderManagement/order/order.utils";
import { TImageToOrder } from "./imageToOrder.interface";
import { ImageToOrder } from "./imageToOrder.model";
import { ImageToOrderUtils } from "./imageToOrder.utils";

const createIntoDB = async (
  user: TOptionalAuthGuardPayload,
  payload: TImageToOrder
) => {
  payload.reqId = ImageToOrderUtils.createReqId();
  const userQuery = optionalAuthUserQuery(user);
  payload.userId = user.id ? new Types.ObjectId(user.id) : undefined;
  payload.sessionId = userQuery.sessionId as string;
  payload.officialNote = undefined;
  payload.contactStatus = "pending";
  payload.status = "pending";
  payload.orderId = undefined;
  const result = await ImageToOrder.create(payload);
  return result;
};

const getAllReqAdminFromDB = async () => {
  const pipeline = ImageToOrderUtils.getRequestPipeline();

  const matchQuery: PipelineStage = {
    $match: {
      status: { $in: ["pending", "confirmed"] },
    },
  };

  pipeline.unshift(matchQuery);
  const result = await ImageToOrder.aggregate(pipeline);
  return result;
};

const getReqByIdAdminFromDB = async (id: Types.ObjectId) => {
  const pipeline = ImageToOrderUtils.getRequestPipeline();

  const matchQuery: PipelineStage = {
    $match: {
      _id: new Types.ObjectId(id),
      status: "pending",
    },
  };

  pipeline.unshift(matchQuery);
  const result = (await ImageToOrder.aggregate(pipeline))[0];

  return result;
};

const updateReqByAdminIntoDB = async (
  reqId: Types.ObjectId,
  payload: TImageToOrder
) => {
  const existingData = await ImageToOrder.findById(reqId);

  const updatedDoc: Partial<TImageToOrder> = {};
  if (payload.contactStatus) updatedDoc.contactStatus = payload.contactStatus;
  if (payload.status) {
    updatedDoc.status = payload.status;

    if (existingData?.contactStatus !== "confirmed") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Please contact to the customer first"
      );
    }
    if (payload.status === "canceled") {
      updatedDoc.images = [];
      if (existingData?.images?.length) {
        existingData?.images?.forEach((item) => {
          try {
            const folderPath = path.parse(item.path).dir;
            fsEx.remove(folderPath);
            // eslint-disable-next-line no-empty
          } finally {
          }
        });
      }
    }
  }
  const result = await ImageToOrder.findOneAndUpdate(
    { _id: existingData?._id },
    updatedDoc,
    { new: true }
  );
  return result;
};

const createOrderIntoDB = async (id: Types.ObjectId, req: Request) => {
  const session = await mongoose.startSession();
  let order;
  try {
    session.startTransaction();

    const orderReq = await ImageToOrder.findById(id);
    if (!orderReq)
      throw new ApiError(httpStatus.BAD_REQUEST, "No image to order found");

    if (orderReq?.orderId)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "This request already processed"
      );

    if (orderReq?.status === "canceled")
      throw new ApiError(httpStatus.BAD_REQUEST, "This request is canceled");

    if (orderReq?.status !== "confirmed") {
      throw new ApiError(httpStatus.BAD_REQUEST, "Please confirm the order");
    }

    req.body.custom = true;
    req.body.orderNotes = orderReq.customerNotes;
    req.body.orderSource = {
      name: "Image to order",
    };

    order = await createNewOrder(
      req as unknown as Record<string, unknown>,
      session,
      { warrantyClaim: false }
    );

    if (orderReq?.images?.length) {
      orderReq?.images?.forEach((item) => {
        try {
          const folderPath = path.parse(item.path).dir;
          fsEx.remove(folderPath);
          // eslint-disable-next-line no-empty
        } finally {
        }
      });
    }

    await ImageToOrder.findByIdAndUpdate(orderReq?._id, {
      status: "completed",
      orderId: order?._id,
      images: [],
    });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
  return order;
};

export const ImageToOrderService = {
  createIntoDB,
  getAllReqAdminFromDB,
  getReqByIdAdminFromDB,
  updateReqByAdminIntoDB,
  createOrderIntoDB,
};
