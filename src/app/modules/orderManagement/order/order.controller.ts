import { Request, Response } from "express";
import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import config from "../../../config/config";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TOrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.interface";
import { TOrder } from "./order.interface";
import { OrderServices } from "./order.service";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.createOrderIntoDB(req as Request);

  successResponse<TOrder>(res, {
    statusCode: httpStatus.CREATED,
    message: "Order created successfully",
    data: result,
  });
});

const getOrderInfoByOrderIdCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await OrderServices.getOrderInfoByOrderIdCustomerFromDB(
      req.user as TOptionalAuthGuardPayload,
      id
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Customers order info retrieved successfully",
      data: result,
    });
  }
);

const getOrderInfoByOrderIdAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await OrderServices.getOrderInfoByOrderIdAdminFromDB(
      id as unknown as mongoose.Types.ObjectId
    );

    successResponse<TOrder>(res, {
      statusCode: httpStatus.OK,
      message: "Single order for admin retrieved successfully",
      data: result,
    });
  }
);

const getAllOrdersCustomer = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getAllOrdersCustomerFromDB(
    req.user as TOptionalAuthGuardPayload
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Customers orders info retrieved successfully",
    data: result,
  });
});

const getAllOrdersAdmin = catchAsync(async (req: Request, res: Response) => {
  const { meta, data, countsByStatus } =
    await OrderServices.getAllOrdersAdminFromDB(
      req.query as unknown as Record<string, string>
    );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All orders retrieved successfully",
    meta,
    data: {
      countsByStatus,
      data,
    },
  });
});

const getProcessingOrdersAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { countsByStatus, meta, data } =
      await OrderServices.getProcessingOrdersAdminFromDB(
        req.query as unknown as Record<string, string>
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Processing orders retrieved successfully",
      meta,
      data: {
        countsByStatus,
        data,
      },
    });
  }
);

const getCompletedOrdersAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { countsByStatus, meta, data } =
      await OrderServices.getCompletedOrdersAdminFromDB(
        req.query as unknown as Record<string, string>
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Completed and returned orders retrieved successfully",
      meta,
      data: {
        countsByStatus,
        data,
      },
    });
  }
);

const getProcessingDoneCourierOrdersAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { countsByStatus, meta, data } =
      await OrderServices.getProcessingDoneCourierOrdersAdminFromDB(
        req.query as unknown as Record<string, string>
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Processing done and on courier orders retrieved successfully",
      meta,
      data: {
        countsByStatus,
        data,
      },
    });
  }
);

const getOrdersByDeliveryStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { countsByStatus, meta, data } =
      await OrderServices.getOrdersByDeliveryStatusFromDB(
        req.query as unknown as Record<string, string>
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Orders delivery status retrieved successfully",
      meta,
      data: {
        countsByStatus,
        data,
      },
    });
  }
);

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  await OrderServices.updateOrderStatusIntoDB(user as TJwtPayload, req.body);

  successResponse<TOrderStatusHistory>(res, {
    statusCode: httpStatus.OK,
    message: "Status updated successfully",
  });
});

const updateProcessingStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { orderIds, status } = req.body;
    await OrderServices.updateProcessingStatusIntoDB(
      orderIds,
      status,
      req.user as TJwtPayload
    );

    successResponse<TOrderStatusHistory>(res, {
      statusCode: httpStatus.OK,
      message: "Status updated successfully",
    });
  }
);

const bookCourierAndUpdateStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { status, orderIds } = req.body;
    const courierProvider = new Types.ObjectId(config.courier_provider_id);
    const { message, ...result } =
      await OrderServices.bookCourierAndUpdateStatusIntoDB(
        orderIds,
        status,
        courierProvider,
        req.user as TJwtPayload
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: message || "Courier booked successfully",
      data: result,
    });
  }
);

const updateOrderDetailsByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    await OrderServices.updateOrderDetailsByAdminIntoDB(
      req.params.id as unknown as mongoose.Types.ObjectId,
      req.body
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order details updated successfully.",
    });
  }
);

const deleteOrdersById = catchAsync(async (req: Request, res: Response) => {
  const { orderIds } = req.body;
  await OrderServices.deleteOrdersByIdFromBD(orderIds);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order deleted successfully.",
  });
});

const orderCountsByStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.orderCountsByStatusFromBD();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Orders count by status",
    data: result,
  });
});

const updateOrdersDeliveryStatus = catchAsync(
  async (req: Request, res: Response) => {
    await OrderServices.updateOrdersDeliveryStatusIntoDB();
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order delivery status updated successfully",
    });
  }
);

const getCustomersOrdersCountByPhone = catchAsync(
  async (req: Request, res: Response) => {
    const { phoneNumber } = req.params;
    const result =
      await OrderServices.getCustomersOrdersCountByPhoneFromDB(phoneNumber);
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order delivery status updated successfully",
      data: result,
    });
  }
);

const getOrderTrackingInfo = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const result = await OrderServices.getOrderTrackingInfo(orderId);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order data retrieved successfully",
    data: result,
  });
});

const returnAndPartialManagement = catchAsync(
  async (req: Request, res: Response) => {
    const { orderIds, status } = req.body;
    await OrderServices.returnAndPartialManagementIntoDB(
      orderIds,
      status,
      req.user as TJwtPayload
    );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Operation success",
    });
  }
);

const getMobileNumbersForSendingSMS = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrderServices.getMobileNumbersForSendingSMSFromDB(
      req.query as unknown as Record<string, string>
    );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Phone number retrieved successfully",
      data: result,
    });
  }
);

const schedulePickupFromOrder = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as TJwtPayload;
    const result = await OrderServices.schedulePickupFromOrderIntoDB(
      req.body,
      user
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Pickup scheduled successfully",
      data: result,
    });
  }
);

const getCourierForOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getCourierForOrder();

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Courier retrieved successfully",
    data: result,
  });
});

export const OrderController = {
  createOrder,
  getOrderInfoByOrderIdCustomer,
  getOrderInfoByOrderIdAdmin,
  getAllOrdersCustomer,
  updateStatus,
  getAllOrdersAdmin,
  getCompletedOrdersAdmin,
  getProcessingOrdersAdmin,
  updateOrderDetailsByAdmin,
  deleteOrdersById,
  orderCountsByStatus,
  updateOrdersDeliveryStatus,
  updateProcessingStatus,
  bookCourierAndUpdateStatus,
  getProcessingDoneCourierOrdersAdmin,
  getCustomersOrdersCountByPhone,
  getOrderTrackingInfo,
  getOrdersByDeliveryStatus,
  returnAndPartialManagement,
  getMobileNumbersForSendingSMS,
  schedulePickupFromOrder,
  getCourierForOrder,
};
