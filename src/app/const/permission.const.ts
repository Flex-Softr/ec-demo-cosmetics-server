export const PERMISSIONS = {
  SUPER_ADMIN: "superAdmin",
  MANAGE_ADMIN_OR_STAFF: "manageAdminOrStaff",
  MANAGE_PERMISSION: "managePermission",
  MANAGE_CUSTOMER: "manageCustomer",
  MANAGE_PRODUCT: "manageProduct",
  MANAGE_BLOG: "manageBlog",
  MANAGE_ORDER: "manageOrder",
  MANAGE_PROCESSING_ORDER: "manageProcessingOrder",
  MANAGE_SHIPMENT_ORDER: "manageShipmentOrder",
  MANAGE_IMAGE_TO_ORDER: "manageImageToOrder",
  MANAGE_WARRANTY_CLAIM: "manageWarrantyClaim",
  MANAGE_COUPON: "manageCoupon",
  MANAGE_SHIPPING_CHARGE: "manageShippingCharge",
  MANAGE_PAYMENT_METHOD: "managePaymentMethod",
  MANAGE_COURIER: "manageCourier",
  MANAGE_SMS: "manageSms",
  MANAGE_CONTACT_MESSAGE: "manageContactMessage",
} as const;

export const permissionList = Object.values(PERMISSIONS);
