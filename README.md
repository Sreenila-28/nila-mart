# NilaMart - C++20 Full-Stack E-Commerce Capstone Project

**NilaMart** is an enterprise-grade, high-performance e-commerce platform designed and built with modern C++20, the Drogon web framework, and PostgreSQL. It delivers an Amazon/Flipkart-caliber shopping experience with real-time transactional integrity, strict relational schemas, role-based access control, date-range sales analytics, and an integrated AI shopping assistant.

---

## 🌟 Key Features

1. **Enterprise C++20 Drogon Backend**:
   - Modern C++20 asynchronous REST API engine using the Drogon web framework.
   - Clean layered architecture: **Controllers**, **Services**, **Repositories**, and **Models**.
   - Asynchronous PostgreSQL connection pooling with non-blocking I/O.
   - Robust JWT authentication and role-based access control (RBAC) middleware.
   - Global CORS management and standardized error response formatting.

2. **Normalized PostgreSQL Relational Database**:
   - 9 interconnected relational tables with foreign keys, constraints, and cascade rules:
     - `users`, `categories`, `products`, `cart_items`, `orders`, `order_items`, `reviews`, `wishlist_items`, `order_status_history`
   - Real date/time records utilizing `TIMESTAMPTZ` and automatic `update_updated_at_column()` triggers.
   - High-precision monetary columns utilizing `NUMERIC(12, 2)` (never floating point).
   - Order history snapshots: preserves product names and purchased unit prices even if products are edited or deleted later.
   - Complete audit trail of order status transitions in `order_status_history`.

3. **Role-Based Access Control (RBAC)**:
   - **Buyer**: Browse catalog, search with multi-criteria filtering, manage wishlist, persistent cart, transactional checkout, order history with status timeline, and verified product reviews.
   - **Seller**: Dedicated Seller Studio to create, edit, and delete products, manage prices and stock, view incoming orders for their products, and track seller revenue.
   - **Admin**: Executive Dashboard with KPI cards, user management, product moderation, order status workflow manager, and parameterized date-range sales reports.

4. **ACID Transactional Checkout**:
   - Backend-authoritative order checkout with row locking (`FOR UPDATE`).
   - Validates live stock before order creation.
   - Decrements stock atomically and records initial order status in history.
   - Clears cart only after successful commit; full rollback if any check fails.

5. **AI Shopping Assistant**:
   - Integrated shopping concierge powered by Google Gemini 3.8 Flash.
   - Understands product recommendations, budget constraints, and store policies.

---

## 📁 Project Structure

```
NilaMart/
├── CMakeLists.txt              # Modern CMake 3.20+ build configuration
├── README.md                   # Complete documentation and setup guide
├── API_DOCUMENTATION.md        # Comprehensive REST API specifications
├── run_powershell.ps1          # 1-click Windows PowerShell build & run script
├── setup_db.sh                 # PostgreSQL database initialization script
│
├── backend/                    # C++20 Drogon REST API Backend
│   ├── main.cc                 # Drogon server entry point & listener setup
│   ├── config.json             # Drogon configuration (DB pool, threads, ports)
│   ├── controllers/            # HTTP Controllers
│   │   ├── ApiController.h
│   │   ├── ApiController.cc
│   │   ├── AiChatController.h
│   │   └── AiChatController.cc
│   ├── models/                 # Domain DTOs and JsonCpp serialization
│   │   └── Models.h
│   ├── repositories/           # PostgreSQL Database Repositories
│   │   └── Repositories.h
│   ├── services/               # Layered Business Logic
│   │   └── Services.h
│   └── middleware/             # Drogon HTTP Filters (CORS, Auth)
│       └── Filters.h
│
├── database/                   # Relational Database Scripts
│   ├── schema.sql              # Normalized PostgreSQL schema with 9 tables
│   ├── seed.sql                # Seed data (Admin, Sellers, Buyers, Products)
│   ├── verification_queries.sql# SQL verification queries for test grading
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── server.ts                   # Full-Stack live dev server with identical REST APIs
└── src/                        # Modern Responsive Frontend (React + Tailwind)
```

---

## 🚀 Getting Started

### Prerequisites
- **C++ Compiler**: GCC 11+, Clang 13+, or MSVC 2022 (supporting C++20)
- **CMake**: Version 3.20 or newer
- **Drogon Web Framework**: Installed via `vcpkg` or compiled from source
- **PostgreSQL**: Version 14 or newer
- **Node.js**: Version 18+ (for frontend development)

---

### Step 1: Database Setup
```bash
# On Linux / macOS
chmod +x setup_db.sh
./setup_db.sh

# Or using psql directly:
psql -U postgres -c "CREATE DATABASE nilamart;"
psql -U postgres -d nilamart -f database/schema.sql
psql -U postgres -d nilamart -f database/seed.sql
```

---

### Step 2: Build & Run C++ Drogon Backend

#### Option A: Windows (PowerShell)
```powershell
.\run_powershell.ps1
```

#### Option B: Linux / macOS
```bash
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . --parallel
./nilamart_server
```
The server will start on `http://localhost:8080`.

---

### Step 3: Run the Web App
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🔑 Default Credentials for Testing

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@nilamart.com` | `admin123` |
| **Seller 1** | `seller.tech@nilamart.com` | `seller123` |
| **Seller 2** | `seller.fashion@nilamart.com` | `seller123` |
| **Buyer 1** | `buyer.alice@nilamart.com` | `buyer123` |
| **Buyer 2** | `buyer.bob@nilamart.com` | `buyer123` |

---

## 🧪 Verification & Grading Checklist

- [x] **Relational Schema**: 9 tables with foreign keys, constraints, and indexes.
- [x] **TIMESTAMPTZ Dates**: Real server timestamps saved automatically.
- [x] **Authentication**: Password hashing with bcrypt, JWT authorization.
- [x] **Buyer Operations**: Product catalog, search, filters, wishlist, cart.
- [x] **Transactional Checkout**: Stock verification, row locking, rollback on insufficient stock.
- [x] **Seller Studio**: CRUD product management, view orders for seller items.
- [x] **Admin Hub**: User management, order status changer with audit log, date-range reports.
- [x] **AI Assistant**: Conversational shopping guide powered by Gemini API.
- [x] **Source Code Explorer**: Live in-browser inspection of C++ Drogon source code.
