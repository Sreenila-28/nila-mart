# NilaMart REST API Specification

Comprehensive REST API documentation for the NilaMart Full-Stack E-Commerce platform powered by C++20 Drogon and PostgreSQL.

**Base URL**: `/api/v1`  
**Authentication**: Bearer Token in `Authorization` header (`Bearer <JWT_TOKEN>`)  
**Data Format**: JSON (`Content-Type: application/json`)

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Sarah Connor",
  "email": "sarah@example.com",
  "password": "Password123!",
  "role": "BUYER" // or "SELLER" (ADMIN accounts must be provisioned via secure seed)
}
```
- **Response 201 Created**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 6,
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "role": "BUYER",
    "created_at": "2026-10-20T22:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.2 Login User
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "buyer.alice@nilamart.com",
  "password": "buyer123"
}
```
- **Response 200 OK**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 4,
    "name": "Alice Buyer",
    "email": "buyer.alice@nilamart.com",
    "role": "BUYER",
    "created_at": "2026-09-15T14:20:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.3 Get Current User
- **Method**: `GET`
- **Path**: `/api/v1/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response 200 OK**: Returns authenticated user profile.

---

## 2. Catalog & Products Endpoints

### 2.1 List Categories
- **Method**: `GET`
- **Path**: `/api/v1/categories`
- **Access**: Public

### 2.2 List Products
- **Method**: `GET`
- **Path**: `/api/v1/products`
- **Query Parameters**:
  - `category_id` (integer, optional)
  - `search` (string, optional)
  - `min_price` (numeric, optional)
  - `max_price` (numeric, optional)
  - `sort` (`price_asc` | `price_desc` | `newest` | `rating`)

### 2.3 Get Product Details
- **Method**: `GET`
- **Path**: `/api/v1/products/{id}`

### 2.4 Create Product
- **Method**: `POST`
- **Path**: `/api/v1/products`
- **Access**: `SELLER` or `ADMIN`
- **Request Body**:
```json
{
  "category_id": 1,
  "name": "Noise Cancelling Earbuds Pro",
  "description": "High fidelity audio with 36-hour playback",
  "price": 129.99,
  "stock_quantity": 25,
  "image_url": "https://images.unsplash.com/photo-..."
}
```

### 2.5 Update Product
- **Method**: `PUT`
- **Path**: `/api/v1/products/{id}`
- **Access**: Seller (must own the product) or Admin

### 2.6 Delete Product
- **Method**: `DELETE`
- **Path**: `/api/v1/products/{id}`
- **Access**: Seller (must own the product) or Admin

---

## 3. Cart & Shopping Operations

### 3.1 Get Cart
- **Method**: `GET`
- **Path**: `/api/v1/cart`
- **Access**: `BUYER` (persisted in PostgreSQL)

### 3.2 Add to Cart
- **Method**: `POST`
- **Path**: `/api/v1/cart`
- **Request Body**: `{"product_id": 2, "quantity": 1}`

### 3.3 Update Cart Item Quantity
- **Method**: `PUT`
- **Path**: `/api/v1/cart/{productId}`
- **Request Body**: `{"quantity": 3}`

### 3.4 Remove Item from Cart
- **Method**: `DELETE`
- **Path**: `/api/v1/cart/{productId}`

### 3.5 Clear Cart
- **Method**: `DELETE`
- **Path**: `/api/v1/cart`

---

## 4. Checkout & Order Management

### 4.1 Checkout Order (ACID Database Transaction)
- **Method**: `POST`
- **Path**: `/api/v1/orders/checkout`
- **Access**: `BUYER`
- **Request Body**:
```json
{
  "shipping_address": "452 Elm Street, Seattle, WA 98101",
  "payment_method": "CREDIT_CARD"
}
```
- **Transaction Steps Performed**:
  1. Validates buyer identity and non-empty cart.
  2. Acquires row lock on products and verifies sufficient stock.
  3. Inserts `orders` record with `CONFIRMED` status.
  4. Inserts `order_status_history` record with initial timestamp.
  5. Inserts all `order_items` preserving snapshot price and name.
  6. Safely decrements product `stock_quantity`.
  7. Clears `cart_items` for the buyer.
  8. Commits transaction (rolls back on any failure).

### 4.2 Buyer Order History
- **Method**: `GET`
- **Path**: `/api/v1/orders/my-orders`
- **Access**: `BUYER`

### 4.3 Seller Orders
- **Method**: `GET`
- **Path**: `/api/v1/orders/seller`
- **Access**: `SELLER` (shows only orders containing items belonging to the seller)

### 4.4 Get Order Details & Status History
- **Method**: `GET`
- **Path**: `/api/v1/orders/{id}`

### 4.5 Update Order Status
- **Method**: `PUT`
- **Path**: `/api/v1/orders/{id}/status`
- **Access**: `ADMIN` or `SELLER`
- **Request Body**: `{"status": "SHIPPED"}`

---

## 5. Reviews & Wishlist

### 5.1 Get Product Reviews
- **Method**: `GET`
- **Path**: `/api/v1/reviews/product/{id}`

### 5.2 Submit Review (Verified Buyer Required)
- **Method**: `POST`
- **Path**: `/api/v1/reviews`
- **Access**: `BUYER` (Validates that buyer previously purchased product)
- **Request Body**:
```json
{
  "product_id": 1,
  "rating": 5,
  "comment": "Incredible sound isolation and supreme comfort!"
}
```

### 5.3 Toggle Wishlist Item
- **Method**: `POST`
- **Path**: `/api/v1/wishlist/{productId}`

---

## 6. Admin Management & Analytics

### 6.1 System Statistics
- **Method**: `GET`
- **Path**: `/api/v1/admin/stats`
- **Access**: `ADMIN`

### 6.2 Admin User Management
- **Method**: `GET`
- **Path**: `/api/v1/admin/users`

### 6.3 Admin Orders with Date Filtering
- **Method**: `GET`
- **Path**: `/api/v1/admin/orders?start_date=2026-10-01&end_date=2026-10-31&status=CONFIRMED`

### 6.4 Date-Range Sales Reports
- **Method**: `GET`
- **Path**: `/api/v1/admin/reports/sales?start_date=2026-10-01&end_date=2026-10-31`

---

## 7. AI Shopping Assistant
- **Method**: `POST`
- **Path**: `/api/v1/ai/chat`
- **Request Body**: `{"message": "I need a comfortable pair of noise-cancelling headphones under $200"}`
