import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const env = process.env;

export default {
  env: env.NODE_ENV,
  log_error: env.LOG_ERROR,
  port: env.PORT,
  company_name: env.COMPANY_NAME,
  admin_email: env.ADMIN_EMAIL,
  DBUrl: env.DB_URL,
  clientSideURL: env.CLIENT_SIDE_URL,
  main_domain: env.MAIN_DOMAIN,
  image_base_url: env.IMAGE_BASE_URL,
  bcrypt_salt_round: env.BCRYPT_SALT_ROUND,
  token_data: {
    access_token_secret: env.ACCESS_TOKEN_SECRET,
    refresh_token_secret: env.REFRESH_TOKEN_SECRET,
    access_token_expires: env.ACCESS_TOKEN_EXPIRES,
    customer_refresh_token_expires: env.CUSTOMER_REFRESH_TOKEN_EXPIRES,
    admin_staff_refresh_token_expires: env.ADMIN_STAFF_REFRESH_TOKEN_EXPIRES,
    access_token_cookie_expires: env.ACCESS_TOKEN_COOKIE_EXPIRES,
    customer_refresh_token_cookie_expires:
      env.CUSTOMER_REFRESH_TOKEN_COOKIE_EXPIRES,
    admin_staff_refresh_token_cookie_expires:
      env.ADMIN_STAFF_REFRESH_TOKEN_COOKIE_EXPIRES,
  },
  session_secret: env.SESSION_SECRET,
  session_expires: env.SESSION_EXPIRES,
  cart_item_expires: env.CART_ITEM_EXPIRES,
  upload_image_size: env.UPLOAD_IMAGE_SIZE,
  upload_video_size: env.UPLOAD_VIDEO_SIZE,
  upload_image_maxCount: env.UPLOAD_IMAGE_MAX_COUNT,
  upload_image_format: env.UPLOAD_IMAGE_FORMAT,
  twilio: {
    sid: env.TWILIO_ACCOUNT_SID,
    auth_token: env.TWILIO_AUTH_TOKEN,
    phone_number: env.TWILIO_PHONE_NUMBER,
  },
  stead_fast: {
    api_key: env.STEAD_FAST_API_KEY,
    secret_key: env.STEAD_FAST_SECRET_KEY,
    email: env.STEADFAST_EMAIL,
    password: env.STEADFAST_PASSWORD,
  },
  pathao: {
    username: env.PATHAO_USERNAME,
    password: env.PATHAO_PASSWORD,
  },
  redx: {
    phoneNumber: env.REDX_PHONE_NUMBER,
    password: env.REDX_PASSWORD,
  },
  paperfly: {
    username: env.PAPERFLY_USERNAME,
    password: env.PAPERFLY_PASSWORD,
  },
  courier_provider_id: env.COURIER_PROVIDER_ID,
  google: {
    smtp_user: env.GOOGLE_SMTP_USER,
    smtp_pass: env.GOOGLE_SMTP_PASS,
  },
  fullName: env.FULL_NAME,
  phoneNumber: env.PHONE_NUMBER,
  email: env.EMAIL,
  password: env.PASSWORD,
  fullAddress: env.FULL_ADDRESS,
  tmp_shipping_id: env.SHIPPING_ID,
  banglaLink: {
    base_url: env.BL_BASE_URL || "https://corpsms.banglalink.net/bl",
    user: env.BL_USER,
    pass: env.BL_PASS,
    bill_msisdn: env.BL_BILL_MSISDN,
  },
  order_tracking_url: env.ORDER_TRACKING_URL || "",
};
