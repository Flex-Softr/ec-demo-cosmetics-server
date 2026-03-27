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

router.get("/customer/:id", OrderController.getOrderDetailsForCustomer);

router.get(
  "/admin/order-id/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    //    requiredPermission: PERMISSIONS.SUPER_ADMIN,
  }),
  OrderController.getOrderDetailsForAdmin
);

router.get(
  "/customer",
  authGuard({ requiredRoles: [ROLES.CUSTOMER, ROLES.SUPER_ADMIN] }),
  OrderController.getAllOrdersForCustomer
);

router.get(
  "/admin/all-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ORDER,
  }),
  OrderController.getAllOrdersForAdmin
);

router.get(
  "/admin/processing-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PROCESSING_ORDER,
  }),
  OrderController.getProcessingOrdersForAdmin
);

router.get(
  "/admin/processing-done-on-courier-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.getCourierShipmentOrdersForAdmin
);

router.get(
  "/admin/completed-returned",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  }),
  OrderController.getCompletedOrdersForAdmin
);

router.get(
  "/admin/order-deliver-status",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    // requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.getMonitorDeliveryOrdersForAdmin
);

router.patch(
  "/update-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ORDER,
  }),
  validateRequest(OrderValidation.updateOrderStatus),
  OrderController.updateOrderStatus
);

router.patch(
  "/update-processing-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PROCESSING_ORDER,
  }),
  validateRequest(OrderValidation.updateProcessingStatus),
  OrderController.updateProcessingOrderStatus
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
  validateRequest(OrderValidation.updateOrderDetails),
  OrderController.updateOrderDetails
);

router.delete(
  "/delete-many",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(OrderValidation.deleteOrders),
  OrderController.deleteOrders
);

router.get(
  "/orders-count-by-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.SUPER_ADMIN,
  }),
  OrderController.getOrderCountsByStatus
);

router.post(
  "/update-order-delivery-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.syncDeliveryStatus
);

router.get(
  "/get-customer-order-count/:phoneNumber",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    // requiredPermission: PERMISSIONS.ORDER.MANAGE,
  }),
  OrderController.getCustomerOrderCountByPhone
);

router.get(
  "/guest-order-history/:phoneNumber",
  OrderController.getGuestOrdersByPhone
);

router.get("/track/:orderId", OrderController.getOrderTrackingInfo);

router.patch(
  "/manage-return-partial",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PROCESSING_ORDER,
  }),
  OrderController.manageReturnAndPartialOrders
);

router.get(
  "/get-phone-numbers",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SMS,
  }),
  OrderController.getPhoneNumbersForSMS
);

router.post(
  "/admin/schedule-pickup",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  validateRequest(OrderValidation.schedulePickupForAOrder),
  OrderController.schedulePickupForAOrder
);

router.post(
  "/admin/bulk-schedule-pickup",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  validateRequest(OrderValidation.bulkSchedulePickupForOrders),
  OrderController.bulkSchedulePickupForOrders
);

router.get(
  "/get-courier-for-order",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.getCourierForOrder
);

export const OrderRoutes = router;
