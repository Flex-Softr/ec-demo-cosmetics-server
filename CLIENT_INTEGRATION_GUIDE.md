# Client Site Integration Guide (Home & Shop)

This document provides a comprehensive guide for integrating the backend APIs with the client-side application (e.g., Next.js/React), specifically focusing on the **Home** and **Shop** pages.

---

## 1. Global Configurations

**Base URL:** `https://api.yourdomain.com/api/v1` (or `http://localhost:5000/api/v1` for dev)
**Image Base URL:** Typically configured in the backend. Images are returned with relative paths or full URLs depending on the endpoint. Current implementation concatenates base URL in aggregation.

---

## 2. Home Page Integration

The Home page typically consists of a Hero Slider, a list of Collections, and various Product sections (Featured, Best Selling).

### 2.1 Hero Slider (Banners)

**Endpoint:** `GET /banner-sliders`

**Usage:** Fetch active sliders to display in the main hero section.
**Sort Order:** The API returns sliders sorted by `sortOrder` (ASC).

**Response Interface:**

```typescript
interface IBanner {
  _id: string;
  name?: string;
  image: {
    src: string; // Full URL
    alt?: string;
  };
  bannerLink?: string; // specific URL to redirect on click
  sortOrder: number;
}
```

### 2.2 Collections List

**Endpoint:** `GET /collections`
**Query Params:** `?isActive=true` (Fetch only active collections)

**Usage:** Display a grid/carousel of product collections.
**Sort Order:** Returned sorted by `sortOrder` (ASC).

**Response Interface:**

```typescript
interface ICollection {
  _id: string;
  title: string;
  slug: string; // Link to: /collections/[slug] or /shop?collection=[slug]
  image: {
    src: string;
    alt?: string;
  };
}
```

### 2.3 Featured Products

**Endpoint:** `GET /products/featured`
**Usage:** Display a "Featured Products" section.

### 2.4 Best Selling Products

**Endpoint:** `GET /products/best-selling`
**Usage:** Display "Best Sellers" or "Trending" section.

---

## 3. Shop Page Integration

The Shop page requires robust filtering, sorting, and pagination.

**Main Endpoint:** `GET /products`

### 3.1 Filtering Parameters

Pass these as query parameters to filter the product list.

| Parameter         | Type   | Format                  | Description                        |
| :---------------- | :----- | :---------------------- | :--------------------------------- |
| `searchTerm`      | string | `?searchTerm=shirt`     | General search by title/SKU.       |
| **`category`**    | string | `?category=slug1,slug2` | Filter by Category **Slug(s)**.    |
| **`subCategory`** | string | `?subCategory=slug1`    | Filter by SubCategory **Slug(s)**. |
| **`brand`**       | string | `?brand=slug1`          | Filter by Brand **Slug(s)**.       |
| **`collection`**  | string | `?collection=slug1`     | Filter by Collection **Slug(s)**.  |
| `minPrice`        | number | `?minPrice=100`         | Minimum Sale Price.                |
| `maxPrice`        | number | `?maxPrice=500`         | Maximum Sale Price.                |

> **Note on Collections:** For the _Client_ API, filter by **Collection Slug** (e.g., `summer-sale`), unlike the Admin API which often uses IDs.

### 3.2 Pagination & Sorting

| Parameter   | Default     | Description                       |
| :---------- | :---------- | :-------------------------------- |
| `page`      | `1`         | Current page number.              |
| `limit`     | `10`        | Items per page.                   |
| `sortBy`    | `createdAt` | Field to sort by (e.g., `price`). |
| `sortOrder` | `desc`      | `asc` or `desc`.                  |

### 3.3 Product Interface (List View)

The `getAllProducts` API returns a lightweight product object suitable for cards.

```typescript
interface IProductCard {
  _id: string;
  title: string;
  slug: string;
  type: "simple" | "variable";

  // Pricing
  regularPrice: number;
  salePrice: number;
  discountPercent?: number;

  // Stock
  stockStatus: string;
  stockAvailable: number;

  // Images
  thumbnail: {
    src: string;
    alt?: string;
  };

  // Metadata
  category: { name: string; slug: string };
  brand: { name: string; slug: string };
  productCollection: { title: string; slug: string }; // Populated
}
```

---

## 4. Single Product Page

**Endpoint:** `GET /products/:slug`

**Usage:** Fetch full product details including:

- Full description / Additional Info
- Gallery Images
- Variations (if `type === 'variable'`)
- Reviews/Ratings
