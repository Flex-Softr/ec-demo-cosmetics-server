import express, { Router } from "express";
import { AuthRouters } from "../modules/authManagement/auth/auth.routes";
import { BannerSliderRoutes } from "../modules/bannerSlider/bannerSlider.routes";
import { CartRoutes } from "../modules/cart/cart.routes";
import { ContactMessageRoutes } from "../modules/contactMessage/contactMessage.routes";
import { CouponRoutes } from "../modules/coupon/coupon.routes";
import { CourierRoutes } from "../modules/courier/courier.routes";
import { DistrictRoutes } from "../modules/district/district.routes";
import { DivisionRoutes } from "../modules/division/division.routes";
import { HomepageSectionRoutes } from "../modules/homepageSection/homepageSection.routes";
import { ImageRoutes } from "../modules/image/image.routes";
import { BookPreviewRoutes } from "../modules/bookPreview/bookPreview.routes";
import { ImageToOrderRoutes } from "../modules/imageToOrder/imageToOrder.routes";
import { MonitoringRoutes } from "../modules/monitoring/health.routes";
import { FraudCheckRoutes } from "../modules/orderManagement/fraudCheck/fraudCheck.routes";
import { OrderRoutes } from "../modules/orderManagement/order/order.routes";
import { ShippingChargeRoutes } from "../modules/orderManagement/shippingCharge/shippingCharge.routes";
import { paymentMethodRoutes } from "../modules/paymentMethod/paymentMethod.routes";
import { AttributeRoutes } from "../modules/productManagement/attribute/attribute.routes";
import { BrandRoutes } from "../modules/productManagement/brand/brand.routes";
import { CategoryRoutes } from "../modules/productManagement/category/category.routes";
import { CollectionRoutes } from "../modules/productManagement/collection/collection.routes";
import { ProductRoutes } from "../modules/productManagement/product/product.routes";
import { ReviewRoutes } from "../modules/productManagement/review/review.route";
import { TagRoutes } from "../modules/productManagement/tag/tag.route";
import { VariationRoutes } from "../modules/productManagement/variation/variation.route";
import { DashboardRoutes } from "../modules/dashboard/dashboard.routes";
import { ReportsRoutes } from "../modules/reports/reports.routes";
import { OrderSMSNotificationRotes } from "../modules/smsManagement/orderSMSNotification/orderSMSNotification.routes";
import { SmsRoutes } from "../modules/smsManagement/sms/sms.routes";
import { SMSReportRoutes } from "../modules/smsManagement/smsReport/smsReport.routes";
import { UpazilaRoutes } from "../modules/upazila/upazila.routes";
import { AdminRoutes } from "../modules/userManagement/admin/admin.routes";
import { CustomerRoutes } from "../modules/userManagement/customer/customer.routes";
import { PermissionRoutes } from "../modules/userManagement/permission/permission.routes";
import { UserRoutes } from "../modules/userManagement/user/user.routes";
import { WarrantyRoutes } from "../modules/warrantyManagement/warranty/warranty.routes";
import { WarrantyClaimRoutes } from "../modules/warrantyManagement/warrantyClaim/warrantyClaim.routes";
import WebhookRoutes from "../modules/webhook/webhook.route";
import { BlogQAcategoryRoutes } from "../modules/blog&QA/blog&QACategory/blog&QACategory.routes";
import { BlogQATagRoutes } from "../modules/blog&QA/blog&QATag/blog&QATag.routes";
import { BlogPostRoutes } from "../modules/blog&QA/blog/blogPost.route";
import { QnARoutes } from "../modules/blog&QA/qna/qna.route";
import { BlogQATopicRoutes } from "../modules/blog&QA/blogQAtopic/blogQATopic.route";

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
    path: "/collections",
    route: CollectionRoutes,
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
    path: "/book-previews",
    route: BookPreviewRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
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
    path: "/dashboard",
    route: DashboardRoutes,
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
    route: BannerSliderRoutes,
  },
  {
    path: "/divisions",
    route: DivisionRoutes,
  },
  {
    path: "/homepage-sections",
    route: HomepageSectionRoutes,
  },
  {
    path: "/contact-messages",
    route: ContactMessageRoutes,
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
  {
    path: "/webhook",
    route: WebhookRoutes,
  },
  {
    path: "/health",
    route: MonitoringRoutes,
  },
  // blog and qa module
  {
    path: "/blog-qa-categories",
    route: BlogQAcategoryRoutes,
  },
  {
    path: "/blog-qa-tags",
    route: BlogQATagRoutes,
  },
  {
    path: "/blog-posts",
    route: BlogPostRoutes,
  },
  {
    path: "/qna",
    route: QnARoutes,
  },
  {
    path: "/blog-qa-topics",
    route: BlogQATopicRoutes,
  },
];

moduleRoutes.forEach((route) => {
  const isLargePayload =
    route.path === "/images" ||
    route.path === "/image-to-order" ||
    route.path === "/book-previews";
  const limitSize = isLargePayload ? "25mb" : "1mb";

  router.use(
    route.path,
    express.json({ limit: limitSize }),
    express.urlencoded({ limit: limitSize, extended: true }),
    route.route
  );
});

export default router;
