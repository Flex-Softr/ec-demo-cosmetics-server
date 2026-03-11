# Contact Message API Documentation

This document outlines the API endpoints available for integrating the Contact Message feature into the dashboard.

## Base URL

`/api/v1/contact-messages`

_(Note: The `/api/v1` prefix is assumed based on standard conventions, please verify with your environment's base URL.)_

## 1. Create Contact Message

Allows users (or website visitors) to submit a contact message.

- **Endpoint:** `POST /`
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "name": "string",
    "phone": "string",
    "email": "string (valid email format)",
    "subject": "string",
    "message": "string"
  }
  ```
- **Success Response:**
  - **Code:** `201 Created`
  - **Body:**
    ```json
    {
      "statusCode": 201,
      "success": true,
      "message": "Contact message sent successfully!",
      "data": { ... }
    }
    ```

## 2. Get All Contact Messages

Retrieves a list of all contact messages. Used for dashboard listing.

- **Endpoint:** `GET /`
- **Authentication:** Required (Roles: `SUPER_ADMIN`, `ADMIN`)
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    {
      "statusCode": 200,
      "success": true,
      "message": "Contact messages retrieved successfully!",
      "data": [
        {
          "_id": "string",
          "name": "string",
          "phone": "string",
          "email": "string",
          "subject": "string",
          "message": "string",
          "createdAt": "date",
          "updatedAt": "date"
        }
      ]
    }
    ```

## 3. Get Single Contact Message

Retrieves details of a specific contact message by ID.

- **Endpoint:** `GET /:id`
- **Authentication:** Required (Roles: `SUPER_ADMIN`, `ADMIN`)
- **Headers:** `Authorization: Bearer <token>`
- **Parameters:** `id` (string) - The ID of the contact message.
- **Success Response:**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    {
      "statusCode": 200,
      "success": true,
      "message": "Contact message retrieved successfully!",
      "data": { ... }
    }
    ```

## 4. Delete Contact Message

Deletes a specific contact message by ID.

- **Endpoint:** `DELETE /:id`
- **Authentication:** Required (Roles: `SUPER_ADMIN`, `ADMIN`)
- **Headers:** `Authorization: Bearer <token>`
- **Parameters:** `id` (string) - The ID of the contact message.
- **Success Response:**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    {
      "statusCode": 200,
      "success": true,
      "message": "Contact message deleted successfully!",
      "data": { ... }
    }
    ```
