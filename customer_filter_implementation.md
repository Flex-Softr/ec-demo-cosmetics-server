# Customer Shop Filter Implementation Guide

This document outlines how to implement the filter system on the customer-facing shop page using the `/products` endpoint (and the `getAllProductsCustomerFromDB` service).

## 1. Endpoint Overview

**Endpoint:** `GET /products`  
**Description:** Fetches products for customers with support for filtering, sorting, and pagination.

---

## 2. Metadata Endpoints (Populating Filter UI)

Before implementing the filters, you need to fetch the available options for your UI (checkboxes, select menus, etc.).

### 📂 Get All Categories

- **Endpoint:** `GET /categories`
- **Use for:** Category list filter.

### 🏷️ Get All Brands/Publishers

- **Endpoint:** `GET /brands`
- **Use for:** Brand/Publisher filter.

### 📚 Get All Collections

- **Endpoint:** `GET /collections`
- **Use for:** Collection filter.

### 💰 Get Price Range

- **Endpoint:** `GET /products/price-range`
- **Use for:** Setting the min/max bounds of your price slider.
- **Example Response:** `{ "data": { "min": 0, "max": 5000 } }`

---

## 3. Product Query Parameters

### 💰 Price Range

Filter products by their active sale price (or regular price if no sale).

- **Params:** `minPrice`, `maxPrice`
- **Example:** `?minPrice=500&maxPrice=1500`

### 📁 Category Filter

Filter by one or more category slugs.

- **Param:** `category`
- **Format:** Comma-separated strings
- **Example:** `?category=fiction,history`

### 🏷️ Brand/Publisher Filter

Filter by one or more brand/publisher slugs.

- **Param:** `brand`
- **Format:** Comma-separated strings
- **Example:** `?brand=siddikia-prokashoni`

### 📚 Collection Filter

Filter by one or more collection slugs.

- **Param:** `collection`
- **Format:** Comma-separated strings
- **Example:** `?collection=best-sellers,new-arrivals`

### 📦 Stock Status

Filter by availability.

- **Param:** `stock`
- **Possible Values:** `in_stock`, `low_stock`, `out_of_stock`
- **Example:** `?stock=in_stock`

---

## 3. Display & Results Control

### 🔢 Pagination

- **Params:** `page`, `limit`
- **Example:** `?page=1&limit=20`

### 🔃 Sorting

Sort by any field. Use `-` prefix for descending order.

- **Param:** `sort`
- **Common Values:**
  - `createdAt`: Newest first (Default)
  - `-createdAt`: Oldest first
  - `price`: Price: Low to High
  - `-price`: Price: High to Low
- **Example:** `?sort=price`

## 4. Implementation Tips

1. **State Management:** Map your frontend UI state (checkboxes, price sliders) directly to these query parameters.
2. **Debouncing:** Debounce the `price` inputs by ~500ms before triggering a new API call.
3. **URL Sync:** It is recommended to sync the filter state with the URL query string so users can share or bookmark filtered views.
4. **Combined Queries:** You can combine all the above parameters for advanced filtering:
   - `?category=history&minPrice=100&stock=in_stock&sort=-createdAt`
