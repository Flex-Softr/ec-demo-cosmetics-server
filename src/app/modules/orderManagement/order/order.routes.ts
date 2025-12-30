import { Router } from "express";
import { PERMISSIONS } from "../../../const/permission.const";
import authGuard from "../../../middlewares/authGuard";
import optionalAuthGuard from "../../../middlewares/optionalAuthGuard";
import limitRequest from "../../../middlewares/requestLimitHandler";
import validateRequest from "../../../middlewares/validateRequest";
import { ROLES } from "../../userManagement/user/user.const";
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
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    //    requiredPermission: PERMISSIONS.SUPER_ADMIN,
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
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ORDER,
  }),
  OrderController.getAllOrdersAdmin
);

router.get(
  "/admin/processing-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PROCESSING_ORDER,
  }),
  OrderController.getProcessingOrdersAdmin
);

router.get(
  "/admin/processing-done-on-courier-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.getProcessingDoneCourierOrdersAdmin
);

router.get(
  "/admin/completed-returned",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  }),
  OrderController.getCompletedOrdersAdmin
);

router.get(
  "/admin/order-deliver-status",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    // requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.getOrdersByDeliveryStatus
);

router.patch(
  "/update-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ORDER,
  }),
  validateRequest(OrderValidation.updateOrderStatus),
  OrderController.updateStatus
);

router.patch(
  "/update-processing-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PROCESSING_ORDER,
  }),
  validateRequest(OrderValidation.updateProcessingStatus),
  OrderController.updateProcessingStatus
);

router.patch(
  "/book-courier-and-update-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  validateRequest(OrderValidation.bookCourierAndUpdateStatus),
  OrderController.bookCourierAndUpdateStatus
);

router.patch(
  "/update-order/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(OrderValidation.updateOrderDetailsByAdmin),
  OrderController.updateOrderDetailsByAdmin
);

router.delete(
  "/delete-many",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(OrderValidation.deleteOrders),
  OrderController.deleteOrdersById
);

router.get(
  "/orders-count-by-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.SUPER_ADMIN,
  }),
  OrderController.orderCountsByStatus
);

router.post(
  "/update-order-delivery-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.updateOrdersDeliveryStatus
);

router.get(
  "/get-customer-order-count/:phoneNumber",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    // requiredPermission: PERMISSIONS.ORDER.MANAGE,
  }),
  OrderController.getCustomersOrdersCountByPhone
);

router.get("/track/:orderId", OrderController.getOrderTrackingInfo);

router.patch(
  "/manage-return-partial",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PROCESSING_ORDER,
  }),
  OrderController.returnAndPartialManagement
);

router.get(
  "/get-phone-numbers",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SMS,
  }),
  OrderController.getMobileNumbersForSendingSMS
);

export const OrderRoutes = router;
