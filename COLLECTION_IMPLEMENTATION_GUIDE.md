# Collection Feature & Product Integration Guide

This document details the implementation of the **Collection Management** feature and the associated updates required in the **Product Management** module. It is intended for frontend developers working on the Admin Dashboard.

---

## Part 1: Collection Module (Primary Focus)

The **Collection** module allows admins to organize products into groups (e.g., "Summer Sale", "New Arrivals").

### 1.1 Data Schema (Frontend Interface)

**TypeScript Interface:**

```typescript
export interface ICollection {
  _id: string;
  title: string;
  slug: string;
  image?: string; // ObjectId of the Image
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // The 'products' array is populated in the Single Collection Get API
  products?: IProduct[];
}

export interface ICreateCollectionPayload {
  title: string;
  slug?: string; // Auto-generated if omitted
  image?: string; // ObjectId from Image Upload
  isActive?: boolean; // Defaults to true
}

export interface IUpdateCollectionPayload {
  title?: string;
  slug?: string;
  image?: string;
  isActive?: boolean;
}
```

### 1.2 API Endpoints

Base URL: `/api/v1/collections`

| Action      | Method   | Endpoint | Description                                                                             |
| :---------- | :------- | :------- | :-------------------------------------------------------------------------------------- |
| **Get All** | `GET`    | `/`      | Returns list of collections. Support pagination if implemented (currently returns all). |
| **Get One** | `GET`    | `/:slug` | Returns a single collection **AND** its associated products.                            |
| **Create**  | `POST`   | `/`      | Create a new collection.                                                                |
| **Update**  | `PATCH`  | `/:id`   | Update collection details by ID.                                                        |
| **Delete**  | `DELETE` | `/:id`   | Soft delete a collection by ID.                                                         |

### 1.3 Implementation Notes for Frontend

- **Image Upload**: The `image` field expects an **Image ID** (ObjectId). You must upload the image to the `/media` endpoint first, get the ID, and then submit it here.
- **Slug Generation**: The backend automatically generates a slug from the `title` if you do not provide one.
- **Active Status**: Use `isActive` to toggle visibility without deleting.

---

## Part 2: Product Module Integration

To support Collections, the **Product** module has been updated. A product now belongs to a **Single Collection**.

### 2.1 Critical Schema Change: `productCollection`

> **WARNING**: The field linking a product to a collection is named **`productCollection`**, NOT `collection`.
>
> _Reason: `collection` is a reserved property name in Mongoose documents, which caused backend conflicts._

**Product Interface Update:**

```typescript
export interface IProduct {
  _id: string;
  title: string;
  // ... other fields

  // UPDATED FIELD
  productCollection?: {
    _id: string;
    title: string;
    slug: string;
  };
}

export interface ICreateProductPayload {
  // ... other fields

  // UPDATED FIELD (Send Collection ID here)
  productCollection?: string;
}
```

### 2.2 Working with Products in Admin Dashboard

#### A. Creating/Editing a Product

When building the "Add Product" or "Edit Product" form:

1.  **Field Label**: "Collection"
2.  **Input Type**: Single Select / Dropdown (Not Multi-select).
3.  **Data Source**: Fetch options from `/api/v1/collections`.
4.  **Payload Key**: Ensure the form submits the selected Collection ID as **`productCollection`**.

#### B. Filtering Products by Collection

The Admin Product List API supports filtering.

**Endpoint:** `GET /api/v1/products/admin`

**Query Parameter:** `collection` (Note: The query param is still named `collection` for simplicity, but it filters the `productCollection` field).

**Example Request:**
`GET /api/v1/products/admin?collection=65a1b2c3d4e5f6...`

- **Usage**: Add a dropdown filter in the Product List table to filter products by their assigned collection.
- **Value**: Pass the **Collection ID**.

---

## Summary Checklist

- [ ] **Collection CRUD**: Implemented pages to List, Create, Edit, and Delete collections.
- [ ] **Product Form**: Updated to use `productCollection` field (Single Select).
- [ ] **Product List**: Added "Filter by Collection" functionality using the Collection ID.
- [ ] **Type Safety**: Updated frontend interfaces to match the new `productCollection` field name.
