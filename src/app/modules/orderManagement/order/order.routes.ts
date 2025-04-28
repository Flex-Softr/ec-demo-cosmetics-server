import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import optionalAuthGuard from "../../../middlewares/optionalAuthGuard";
import limitRequest from "../../../middlewares/requestLimitHandler";
import validateRequest from "../../../middlewares/validateRequest";
import { OrderController } from "./order.controller";
import { OrderValidation } from "./order.validate";

const router = Router();

router.post(
  "/",
  validateRequest(OrderValidation.createOrderValidation),
  optionalAuthGuard,
  limitRequest(1, 3),
  OrderController.createOrder
);

router.get(
  "/customer/:id",
  optionalAuthGuard,
  OrderController.getOrderInfoByOrderIdCustomer
);

router.get(
  "/admin/order-id/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    //   requiredPermission: "manage orders",
  }),
  OrderController.getOrderInfoByOrderIdAdmin
);

router.get(
  "/customer",
  optionalAuthGuard,
  OrderController.getAllOrdersCustomer
);

router.get(
  "/admin/all-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage orders",
  }),
  OrderController.getAllOrdersAdmin
);

router.get(
  "/admin/processing-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage warehouse",
  }),
  OrderController.getProcessingOrdersAdmin
);

router.get(
  "/admin/processing-done-on-courier-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage courier",
  }),
  OrderController.getProcessingDoneCourierOrdersAdmin
);

router.get(
  "/admin/completed-returned",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
  }),
  OrderController.getCompletedOrdersAdmin
);

router.get(
  "/admin/order-deliver-status",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    // requiredPermission: "manage courier",
  }),
  OrderController.getOrdersByDeliveryStatus
);

router.patch(
  "/update-status",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage orders",
  }),
  validateRequest(OrderValidation.updateOrderStatus),
  OrderController.updateStatus
);

router.patch(
  "/update-processing-status",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage warehouse",
  }),
  validateRequest(OrderValidation.updateProcessingStatus),
  OrderController.updateProcessingStatus
);

router.patch(
  "/book-courier-and-update-status",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage courier",
  }),
  validateRequest(OrderValidation.bookCourierAndUpdateStatus),
  OrderController.bookCourierAndUpdateStatus
);

router.patch(
  "/update-order/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin", "staff"] }),
  validateRequest(OrderValidation.updateOrderDetailsByAdmin),
  OrderController.updateOrderDetailsByAdmin
);

router.delete(
  "/delete-many",
  authGuard({ requiredRoles: ["superAdmin", "admin", "staff"] }),
  validateRequest(OrderValidation.deleteOrders),
  OrderController.deleteOrdersById
);

router.get(
  "/orders-count-by-status",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "super admin",
  }),
  OrderController.orderCountsByStatus
);

router.post(
  "/update-order-delivery-status",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage courier",
  }),
  OrderController.updateOrdersDeliveryStatus
);

router.get(
  "/get-customer-order-count/:phoneNumber",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    // requiredPermission: "manage orders",
  }),
  OrderController.getCustomersOrdersCountByPhone
);

router.get("/track/:orderId", OrderController.getOrderTrackingInfo);

router.patch(
  "/manage-return-partial",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage warehouse",
  }),
  OrderController.returnAndPartialManagement
);

router.get(
  "/get-phone-numbers",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage sms",
  }),
  OrderController.getMobileNumbersForSendingSMS
);

export const OrderRoutes = router;
