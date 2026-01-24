Nora-life-style
Nora Lifestyle E-Commerce API
Welcome to the Nora Lifestyle API documentation. This comprehensive collection provides all the endpoints needed to manage a full-featured e-commerce platform, including product management, order processing, customer management, courier integration, and analytics.

📋 Collection Overview
The Nora Lifestyle API is a complete e-commerce backend solution with 200+ endpoints covering:

Product Management: Products, categories, brands, attributes, tags, and reviews

Order Processing: Order creation, status management, tracking, and fulfillment

Customer Management: User accounts, authentication, and customer profiles

Courier Integration: Multi-courier support (Steadfast, Pathao, RedX, Paperfly)

Payment & Shipping: Payment methods, shipping charges, and delivery management

Marketing: Coupons, collections, and promotional banners

Analytics: Comprehensive reporting and business intelligence

Warranty Management: Product warranties and claim processing

🔗 Base URL and Variables
Required Variables
Configure these variables in your environment before using the collection:

Variable Description Example
http://localhost:5000/api/v1 Base API URL for all endpoints https://api.nora-lifestyle.com
Bearer token for authentication Your JWT token from login
{{front_url}} Frontend application URL https://nora-lifestyle.com
https://api-hermes.pathao.com Pathao courier API base URL https://courier-api.pathao.com
{{tracking_server_url}} Order tracking server URL Your tracking server URL
Global Variables
The collection uses the following global variables:

root - Main API base URL

AccessToken - Authentication token (automatically set after login)

🔐 Authentication
The API uses Bearer Token Authentication. Most endpoints require authentication.

How to Authenticate
Login: Use the POST http://localhost:5000/api/v1/auth/login endpoint with your credentials

Token Storage: The access token is automatically stored in

Token Usage: All authenticated requests include the header:

Plain Text
Authorization: Bearer
Authentication Endpoints
Login: POST /auth/login - Get access token

Logout: POST /auth/logout - Invalidate current session

Refresh Token: POST /auth/access-token - Refresh expired token

Change Password: POST /auth/change-password - Update password

Forget Password: POST /auth/forget-password - Request password reset

Reset Password: POST /auth/reset-password - Complete password reset

Logged-in Devices: GET /auth/logged-in-devices - View active sessions

📁 Main Sections

1. Users Management
   Manage user accounts including customers, admins, and staff members.

Create customers, admins, and staff

View user profiles and lists

Update user information

2. Admin Operations
   Administrative functions and settings.

Update admin profiles

Manage administrative settings

3. Customer Management
   Customer-specific operations and profiles.

View all customers

Get individual customer details

Update customer information

4. Authentication (Auth)
   Complete authentication and session management.

Login/Logout

Password management

Token refresh

Session tracking

5. Permissions
   Role-based access control and permission management.

Create permissions

View all permissions

Assign permissions to users

6. Product Management
   Comprehensive product catalog management with nested resources:

Products
Create, read, update, delete products

Get products for admin (with full details)

Get products for customers (public view)

Featured products

Best-selling products

Related products

Categories
Create and manage product categories

Hierarchical category structure

Category-based product filtering

Sub-Categories
Nested categorization

Link to parent categories

Sub-category product listings

Brands
Brand management

Brand-based product filtering

Attributes
Product attributes (size, color, etc.)

Attribute values

Product variations

Tags
Product tagging

Tag-based search and filtering

Reviews
Customer product reviews

Rating management

Review moderation

Images
Product image upload

Image management

Multiple images per product

Collections
Curated product collections

Seasonal collections

Featured collections

7. Orders Management
   Complete order lifecycle management:

Orders
Create orders (standard and custom)

Update order details

Order status management

Processing status tracking

Delivery status updates

Return and partial return handling

Order tracking

Customer order history

Admin order views with filters

Order counts and statistics

Cart
Add items to cart

Update quantities

Remove items

View cart contents

Shipping Charges
Create shipping rules

Update shipping rates

View shipping charges

Admin shipping management

Payment Methods
Create payment methods

View available payment options

8. Coupon Management
   Promotional codes and discounts.

Create coupons

Calculate discounts

View all coupons

Get coupon by code

Manage coupon tags

Update coupons

9. Courier Integration
   Multi-courier support for order fulfillment:

Steadfast
Create orders

Check balance

Track deliveries

Fraud checking

Pathao
Login and authentication

Access token management

Fraud checker

Sandbox testing

RedX
Fraud checking

Order management

Access token handling

Paperfly
Fraud checking

Order integration

General Courier Operations:

Create courier bookings

Book courier and update order status

Fraud customer checking

10. Warranty Management
    Product warranty tracking and claims.

Add warranty to products

Update warranty information

Create warranty claims

Check warranty validity

Process warranty claim orders

Update claim requests

Manage product variations in claims

11. Warranty Claim
    Detailed warranty claim processing.

Submit warranty claims

Track claim status

Create replacement orders

Update claim variations

12. Slider Banner
    Homepage and promotional banners.

Create slider banners

View active banners

Update banner content

Delete banners

13. Reports & Analytics
    Business intelligence and reporting:

Order reports (daily, weekly, monthly, yearly)

Order count by status

Order source tracking

Status change counts

Best-selling products

General statistics

Revenue analytics

14. Location Management
    Geographic data for shipping and delivery:

Divisions
Create divisions

View all divisions

Districts
Create districts

View all districts

Upazilas
Create upazilas (sub-districts)

View all upazilas

15. Image to Order
    Link images to specific orders.

Create image-to-order associations

Create orders from images

Update image orders

View image order details

16. SMS Management
    Customer communication via SMS:

SMS Operations
Send bulk SMS

SMS notifications

Order SMS Notifications
Create SMS notification rules

View all notifications

Update notification settings

SMS Reports
Total SMS sent

SMS usage statistics

17. Tracking
    Order tracking functionality.

Track orders by tracking number

Real-time delivery status

18. Revalidate Cache
    Cache management for frontend.

Trigger cache revalidation

Ensure fresh content delivery

19. Banglalink Integration
    SMS service provider integration.

Send SMS via Banglalink API

Check CLI (Caller Line Identification)

Check account balance

🚀 Getting Started
Step 1: Set Up Environment
Create a new environment named "Nora" (or use existing)

Add the following variables:

Plain Text
root: https://your-api-domain.com
AccessToken: (leave empty, will be set after login)
front_url: https://your-frontend-domain.com
PathaoAPI: https://courier-api.pathao.com
tracking_server_url: https://your-tracking-server.com
Step 2: Authenticate
Navigate to Auth → Login

Update the request body with your credentials:

json
{
"email": "your-email@example.com",
"password": "your-password"
}
Send the request

The will be automatically set

Step 3: Verify Authentication
Navigate to Users → profile

Send the GET request

You should receive your user profile information

Step 4: Explore the API
Start with these common operations:

View products: Product management → product → get all products for customer

View categories: Product management → category → get all categories

View orders: Orders management → Order → Get all orders

💼 Common Workflows
Workflow 1: Creating a New Product
Upload Product Images

Endpoint: POST /images

Upload product images and note the image IDs

Create Product

Endpoint: POST /products

Include product details, category, brand, attributes, and image IDs

Add Product Reviews (Optional)

Endpoint: POST /reviews/{productId}

Add customer reviews for the product

Workflow 2: Processing an Order
Create Order

Endpoint: POST /orders

Submit order with customer details, products, and shipping info

Update Order Status

Endpoint: PATCH /orders/update-status

Change status: pending → processing → completed

Book Courier

Endpoint: PATCH /orders/book-courier-and-update-status

Assign courier and get tracking number

Track Order

Endpoint: GET /orders/track/{trackingNumber}

Monitor delivery status

Update Delivery Status

Endpoint: POST /orders/update-order-delivery-status

Update when delivered/returned/cancelled

Workflow 3: Managing Customer Orders
View Customer Orders

Endpoint: GET /orders/customer

Get all orders for logged-in customer

Track Specific Order

Endpoint: GET /orders/customer/{orderId}

View detailed order information

Check Order Count

Endpoint: GET /orders/get-customer-order-count/{phone}

Get total orders by phone number

Workflow 4: Applying Coupons
Get Coupon Details

Endpoint: GET /coupons/{couponCode}

Verify coupon validity

Calculate Discount

Endpoint: POST /coupons/calculate-coupon-discount

Get discount amount for cart

Create Order with Coupon

Endpoint: POST /orders

Include coupon code in order payload

Workflow 5: Managing Product Categories
Create Category

Endpoint: POST /categories

Create main product category

Create Sub-Category

Endpoint: POST /sub-categories

Link to parent category

Add Products to Category

Endpoint: POST /products

Assign category and sub-category IDs

View Category Products

Endpoint: GET /products?category={categoryId}

Filter products by category

Workflow 6: Fraud Prevention
Check Customer History

Endpoint: GET /orders/get-customer-order-count/{phone}

Review customer order history

Courier Fraud Check

Use courier-specific fraud endpoints:

Steadfast: GET https://steadfast.com.bd/user/frauds/check/{phone}

RedX: GET https://redx.com.bd/api/redx_se/admin/parcel/customer-success-return-rate?phoneNumber={phone}

Internal Fraud Check

Endpoint: GET /check/fraud-customers/{phone}

Check against internal fraud database

Workflow 7: Generating Reports
Daily Statistics

Endpoint: GET /reports/stats?type=today

Get today's sales, orders, revenue

Order Status Report

Endpoint: GET /reports/orders-count-status

View orders by status (pending, processing, completed, etc.)

Best Selling Products

Endpoint: GET /reports/best-selling-product

Identify top-performing products

Order Source Analysis

Endpoint: GET /reports/orders-source-count

Track where orders are coming from

Workflow 8: Warranty Claim Process
Check Warranty

Endpoint: POST /warranty-claim/check-warranty

Verify product warranty status

Create Warranty Claim

Endpoint: POST /warranty-claim

Submit warranty claim with details

Update Claim Status

Endpoint: PATCH /warranty-claim/update-request/{claimId}

Process and update claim

Create Replacement Order

Endpoint: POST /warranty-claim/create-order/{claimId}

Generate replacement order

📊 Response Formats
All API responses follow a consistent format:

Success Response
json
{
"success": true,
"data": { ... },
"message": "Operation successful"
}
Error Response
json
{
"success": false,
"error": "Error message",
"statusCode": 400
}
🔍 Query Parameters
Many GET endpoints support query parameters for filtering and pagination:

sort: Sort results (e.g., -createdAt for descending)

page: Page number for pagination

limit: Results per page

status: Filter by status

division: Filter by division

deliveryStatus: Filter by delivery status

type: Report type (today, thisWeek, thisMonth, thisYear)

Example: GET /products/admin?sort=-title&page=1&limit=20

📞 Support & Resources
API Base URL: Configure in http://localhost:5000/api/v1 variable

Authentication: Bearer token required for most endpoints

Rate Limiting: Contact your API administrator for limits

Environment: Use "Nora" environment for production

🔄 Version Information
This collection is actively maintained and updated. Check the changelog for recent updates and new endpoints.

Note: Replace placeholder values (IDs, phone numbers, etc.) in the example requests with actual values from your system before sending requests.

AUTHORIZATION
Bearer Token
Token
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZWU5YTQ1NzA4OWQ5MzViMmVjNjA1NSIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjpbIm1hbmFnZSBvcmRlcnMiLCJzdXBlciBhZG1pbiIsIm1hbmFnZSBwZXJtaXNzaW9uIl0sInVpZCI6IkEyNDAwMSIsInNlc3Npb25JZCI6IjNlYTA1NGIwOGU4NjYyeHBkdzR4S1FNeEgrbTFESWFHVTZBUT09IiwiaWF0IjoxNzQ1Mzg1MDk5LCJleHAiOjE3NDc5NzcwOTl9.p92tsC5oijWrBw1IxTUXIT4zYcBB6hXu96ZvzZKLwpw

GET
Revalidate
{{front_url}}/api/revalidate?key=834y29b98bsd7&secret=db5cfc3a979be80b88081ba1a441a7fe5da45e00772347be154649fa04da96232595ae02711b91169e29910f76bd87f14f1e9fa82c34c0561375af3863a78f8d
AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionNora-life-style
PARAMS
key
834y29b98bsd7

secret
db5cfc3a979be80b88081ba1a441a7fe5da45e00772347be154649fa04da96232595ae02711b91169e29910f76bd87f14f1e9fa82c34c0561375af3863a78f8d

Example Request
Revalidate
View More
curl
curl --location -g '{{front_url}}/api/revalidate?key=834y29b98bsd7&secret=db5cfc3a979be80b88081ba1a441a7fe5da45e00772347be154649fa04da96232595ae02711b91169e29910f76bd87f14f1e9fa82c34c0561375af3863a78f8d' \
--data ''
Example Response
Body
Headers (0)
No response body
This request doesn't return any response body
Tracking
AUTHORIZATION
Bearer Token
This folder is using Bearer Token from collectionNora-life-style
POST
Track
{{tracking_server_url}}/track
AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionNora-life-style
Body
raw (json)
json
{
"me": "Ab"
}
Example Request
Track
curl
curl --location -g '{{tracking_server_url}}/track' \
--data '{
"me": "Ab"
}'
Example Response
Body
Headers (0)
No response body
This request doesn't return any response body
