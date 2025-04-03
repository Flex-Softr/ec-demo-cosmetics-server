# Electro Commerce Server (APIs)

## 📝 Project Overview

The **ElectroCommerce Server** is a **scalable and secure** backend solution for an **advanced e-commerce platform**. It is responsible for:

- **Product Management**: Handling product data, categories, attributes, brands, images and reviews.
- **Order Management**: Processing customer orders, updating order statuses, and generating invoices.
- **User Authentication & Security**: Implementing **JWT-based authentication** and **role-based access control (RBAC)**.
- **Business Logic Execution**: Enforcing pricing rules, inventory management, and automated order processing.

Built with **robust RESTful APIs**, the **ElectroCommerce Server** ensures **efficient data flows** and an **optimized e-commerce experience**.

### **Key Functionalities:**

- 🔹 **Product Management:** Develop APIs for creating, reading, updating, and deleting product information, including categories, images, brands, attributes, tags, and reviews.
- 🔹 **Order Management:** Supports order creation, views, editing, filtering, and status updates.
- 🔹 **Security & Authentication:** Implements **JWT-based authentication** for user and admin login, with role-based access control to secure critical endpoints.
- 🔹 **Customer Management:** Handles customer data, order histories, and authentication for a personalized user experience.
- 🔹 **Data Validation & Optimization:** Enforces input validation to improve system performance and prevent data errors.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js, MongoDB, Mongoose ODM
- **Authentication:** JWT
- **Validation:** Zod
- **Deployment & Tools:** Postman, Amazon EC2

## 🔐 Security & Authorization

- Secure API endpoints with **JWT-based authentication** for both admins and users.
- **Role-based access control** ensures only authorized users can access critical API endpoints (e.g., only specific privileges can delete or update products, orders).
- Data validation through **Zod** reduces errors and ensures data integrity.
- Comprehensive error handling with standardized API responses to prevent security issues and improve UX.

## 🛢️ Database Design

The **ElectroCommerce Server** utilizes **MongoDB** with a well-structured schema for:

- **Products** (e.g., product details, price, availability)
- **Categories** and **Subcategories** (to organize products)
- **Orders** (tracking customer orders and shipping information)
- **Tags, Brands, and Attributes** (for product classification and advanced filtering)
- **Images** (storing product images and media content)

The database is designed for high performance, optimizing queries for large datasets to handle high traffic and scalability.

## 📦 Installation

Follow these steps to set up the project:

```bash
# Clone the repository
git clone https://github.com/Flex-Softr/Electro-Commerce-Server-Side.git
cd Electro-Commerce-Server

# Copy .env.example to .env and configure the environment variables
cp .env.example .env

# Install dependencies
npm install

# Start the server
npm run dev
```

### Environment Variables

Make sure to configure the `.env` file with appropriate values for:

- **Database connection URL**
- **JWT secret key** and others.
