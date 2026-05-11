import { Request, Response } from "express";
import httpStatus from "http-status";
import mongoose from "mongoose";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TOrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.interface";
import { TOrder } from "./order.interface";
import { OrderServices } from "./order.service";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.createOrder(req as Request);

  successResponse<TOrder>(res, {
    statusCode: httpStatus.CREATED,
    message: "Order created successfully",
    data: result,
  });
});

const getOrderDetailsForCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await OrderServices.getOrderDetailsForCustomer(id);

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Customers order info retrieved successfully",
      data: result,
    });
  }
);

const getOrderDetailsForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await OrderServices.getOrderDetailsForAdmin(
      id as unknown as mongoose.Types.ObjectId
    );

    successResponse<TOrder>(res, {
      statusCode: httpStatus.OK,
      message: "Single order for admin retrieved successfully",
      data: result,
    });
  }
);

const getAllOrdersForCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrderServices.getAllOrdersForCustomer(
      req.user as TOptionalAuthGuardPayload
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Customers orders info retrieved successfully",
      data: result,
    });
  }
);

const getAllOrdersForAdmin = catchAsync(async (req: Request, res: Response) => {
  const { meta, data, countsByStatus } =
    await OrderServices.getAllOrdersForAdmin(
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

const getProcessingOrdersForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { countsByStatus, meta, data } =
      await OrderServices.getProcessingOrders(
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

const getCompletedOrdersForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { countsByStatus, meta, data } =
      await OrderServices.getCompletedOrders(
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

const getCourierShipmentOrdersForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { countsByStatus, meta, data } =
      await OrderServices.getCourierShipmentOrders(
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

const getMonitorDeliveryOrdersForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { countsByStatus, countsByCourier, meta, data } =
      await OrderServices.getMonitorDeliveryOrders(
        req.query as unknown as Record<string, string>
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Orders delivery status retrieved successfully",
      meta,
      data: {
        countsByStatus,
        countsByCourier,
        data,
      },
    });
  }
);

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  await OrderServices.updateOrderStatus(user as TJwtPayload, req.body);

  successResponse<TOrderStatusHistory>(res, {
    statusCode: httpStatus.OK,
    message: "Status updated successfully",
  });
});

const updateProcessingOrderStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { orderIds, status } = req.body;
    await OrderServices.updateProcessingOrderStatus(
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

const updateOrderDetails = catchAsync(async (req: Request, res: Response) => {
  await OrderServices.updateOrderDetails(
    req.params.id as unknown as mongoose.Types.ObjectId,
    req.body
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order details updated successfully.",
  });
});

const deleteOrders = catchAsync(async (req: Request, res: Response) => {
  const { orderIds } = req.body;
  await OrderServices.deleteOrders(orderIds);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order deleted successfully.",
  });
});

const getOrderCountsByStatus = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrderServices.getOrderCountsByStatus();
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Orders count by status",
      data: result,
    });
  }
);

const getCustomerOrderCountByPhone = catchAsync(
  async (req: Request, res: Response) => {
    const { phoneNumber } = req.params;
    const result =
      await OrderServices.getCustomerOrderCountByPhone(phoneNumber);
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order delivery status updated successfully",
      data: result,
    });
  }
);

const getGuestOrdersByPhone = catchAsync(
  async (req: Request, res: Response) => {
    const { phoneNumber } = req.params;
    const result = await OrderServices.getGuestOrdersByPhone(phoneNumber);

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Guest order history retrieved successfully",
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

const updateMonitorDeliveryOrderStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { orderIds, status } = req.body;
    await OrderServices.updateMonitorDeliveryOrderStatus(
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

const getPhoneNumbersForSMS = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrderServices.getPhoneNumbersForSMS(
      req.query as unknown as Record<string, string>
    );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Phone number retrieved successfully",
      data: result,
    });
  }
);

const schedulePickupForAOrder = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as TJwtPayload;
    const result = await OrderServices.schedulePickupForAOrder(req.body, user);

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Pickup scheduled successfully",
      data: result,
    });
  }
);

const bulkSchedulePickupForOrders = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as TJwtPayload;
    const result = await OrderServices.bulkSchedulePickupForOrders(
      req.body,
      user
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Multiple pickups processed",
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

const syncOrderCourierStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await OrderServices.syncOrderCourierStatus(id);

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order status synchronized successfully",
      data: result,
    });
  }
);

export const OrderController = {
  createOrder,
  getOrderDetailsForCustomer,
  getOrderDetailsForAdmin,
  getAllOrdersForCustomer,
  updateOrderStatus,
  getAllOrdersForAdmin,
  getCompletedOrdersForAdmin,
  getProcessingOrdersForAdmin,
  updateOrderDetails,
  deleteOrders,
  getOrderCountsByStatus,
  updateProcessingOrderStatus,
  getCourierShipmentOrdersForAdmin,
  getCustomerOrderCountByPhone,
  getOrderTrackingInfo,
  getMonitorDeliveryOrdersForAdmin,
  updateMonitorDeliveryOrderStatus,
  getPhoneNumbersForSMS,
  schedulePickupForAOrder,
  bulkSchedulePickupForOrders,
  getCourierForOrder,
  getGuestOrdersByPhone,
  syncOrderCourierStatus,
};
