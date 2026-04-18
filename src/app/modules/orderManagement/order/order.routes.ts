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

router.patch(
  "/update-order-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_ORDER,
  }),
  validateRequest(OrderValidation.updateOrderStatus),
  OrderController.updateOrderStatus
);

router.patch(
  "/update-order/:id",
  authGuard({ requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] }),
  validateRequest(OrderValidation.updateOrderDetails),
  OrderController.updateOrderDetails
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

router.patch(
  "/update-processing-order-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PROCESSING_ORDER,
  }),
  validateRequest(OrderValidation.updateProcessingStatus),
  OrderController.updateProcessingOrderStatus
);

router.get(
  "/admin/courier-shipment-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.getCourierShipmentOrdersForAdmin
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
  "/admin/monitor-delivery-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    // requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.getMonitorDeliveryOrdersForAdmin
);

router.patch(
  "/update-monitor-delivery-status",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_PROCESSING_ORDER,
  }),
  OrderController.updateMonitorDeliveryOrderStatus
);

router.get(
  "/admin/completed-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  }),
  OrderController.getCompletedOrdersForAdmin
);

// Must be declared AFTER all specific /admin/... routes to avoid wildcard conflict
router.get(
  "/admin/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    //    requiredPermission: PERMISSIONS.SUPER_ADMIN,
  }),
  OrderController.getOrderDetailsForAdmin
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

router.get(
  "/get-phone-numbers",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SMS,
  }),
  OrderController.getPhoneNumbersForSMS
);

router.get(
  "/get-courier-for-order",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.getCourierForOrder
);

router.patch(
  "/sync-courier-status/:id",
  authGuard({
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    requiredPermission: PERMISSIONS.MANAGE_SHIPMENT_ORDER,
  }),
  OrderController.syncOrderCourierStatus
);

export const OrderRoutes = router;
