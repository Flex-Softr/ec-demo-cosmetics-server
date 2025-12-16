import express, { Router } from "express";
import { AuthRouters } from "../modules/authManagement/auth/auth.routes";
import { CartRoutes } from "../modules/cartManagement/cart/cart.routes";
import { CouponRoutes } from "../modules/coupon/coupon.routes";
import { CourierRoutes } from "../modules/courier/courier.routes";
import { DistrictRoutes } from "../modules/district/district.routes";
import { DivisionRoutes } from "../modules/division/division.routes";
import { ImageRoutes } from "../modules/image/image.routes";
import { ImageToOrderRoutes } from "../modules/imageToOrder/imageToOrder.routes";
import { FraudCheckRoutes } from "../modules/orderManagement/fraudCheck/fraudCheck.routes";
import { OrderRoutes } from "../modules/orderManagement/order/order.routes";
import { ShippingChargeRoutes } from "../modules/orderManagement/shippingCharge/shippingCharge.routes";
import { paymentMethodRoutes } from "../modules/paymentMethod/paymentMethod.routes";
import { AttributeRoutes } from "../modules/productManagement/attribute/attribute.routes";
import { BrandRoutes } from "../modules/productManagement/brand/brand.routes";
import { CategoryRoutes } from "../modules/productManagement/category/category.routes";
import { ProductRoutes } from "../modules/productManagement/product/product.routes";
import { ReviewRoutes } from "../modules/productManagement/review/review.route";
import { SubCategoryRoutes } from "../modules/productManagement/subCategory/subCategory.routes";
import { TagRoutes } from "../modules/productManagement/tag/tag.route";
import { ReportsRoutes } from "../modules/reports/reports.routes";
import { OrderSMSNotificationRotes } from "../modules/smsManagement/orderSMSNotification/orderSMSNotification.routes";
import { SmsRoutes } from "../modules/smsManagement/sms/sms.routes";
import { SMSReportRoutes } from "../modules/smsManagement/smsReport/smsReport.routes";
import { SliderBannerRoutes } from "../modules/themeOption/sliderSection/sliderSection.routes";
import { UpazilaRoutes } from "../modules/upazila/upazila.routes";
import { AdminRoutes } from "../modules/userManagement/admin/admin.routes";
import { CustomerRoutes } from "../modules/userManagement/customer/customer.routes";
import { PermissionRoutes } from "../modules/userManagement/permission/permission.routes";
import { UserRoutes } from "../modules/userManagement/user/user.routes";
import { WarrantyRoutes } from "../modules/warrantyManagement/warranty/warranty.routes";
import { WarrantyClaimRoutes } from "../modules/warrantyManagement/warrantyClaim/warrantyClaim.routes";
import { VariationRoutes } from "../modules/productManagement/variation/variation.route";

type TModuleTypes = {
  path: string;
  route: Router;
};

const router = express();

const moduleRoutes: TModuleTypes[] = [
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRouters,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/customers",
    route: CustomerRoutes,
  },
  {
    path: "/check",
    route: FraudCheckRoutes,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
  {
    path: "/variations",
    route: VariationRoutes,
  },
  {
    path: "/images",
    route: ImageRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/sub-categories",
    route: SubCategoryRoutes,
  },
  {
    path: "/brands",
    route: BrandRoutes,
  },
  {
    path: "/tags",
    route: TagRoutes,
  },
  {
    path: "/attributes",
    route: AttributeRoutes,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
  {
    path: "/carts",
    route: CartRoutes,
  },
  {
    path: "/permissions",
    route: PermissionRoutes,
  },
  {
    path: "/orders",
    route: OrderRoutes,
  },
  {
    path: "/shipping-charges",
    route: ShippingChargeRoutes,
  },
  {
    path: "/payment-method",
    route: paymentMethodRoutes,
  },
  {
    path: "/warranty",
    route: WarrantyRoutes,
  },
  {
    path: "/courier-config",
    route: CourierRoutes,
  },
  {
    path: "/warranty-claim",
    route: WarrantyClaimRoutes,
  },
  {
    path: "/reports",
    route: ReportsRoutes,
  },
  {
    path: "/coupons",
    route: CouponRoutes,
  },
  {
    path: "/image-to-order",
    route: ImageToOrderRoutes,
  },
  {
    path: "/slider-banner",
    route: SliderBannerRoutes,
  },
  {
    path: "/divisions",
    route: DivisionRoutes,
  },
  {
    path: "/districts",
    route: DistrictRoutes,
  },
  {
    path: "/upazilas",
    route: UpazilaRoutes,
  },
  {
    path: "/sms",
    route: SmsRoutes,
  },
  {
    path: "/order-sms-notification",
    route: OrderSMSNotificationRotes,
  },
  {
    path: "/sms-reports",
    route: SMSReportRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
