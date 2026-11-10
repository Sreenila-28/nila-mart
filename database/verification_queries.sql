-- =====================================================================
-- NilaMart Full-Stack E-Commerce - PostgreSQL Verification Queries
-- Run against database: nilamart (PostgreSQL 14+ / 16+)
-- =====================================================================

-- ---------------------------------------------------------------------
-- OPERATION 1 & 2: VERIFY REGISTERED BUYER IN POSTGRESQL
-- ---------------------------------------------------------------------
-- Query to verify newly registered buyer exists in users table with role 'BUYER'
-- and password stored as secure bcrypt hash ($2a$ or $2b$)
SELECT 
    id, 
    name, 
    email, 
    role, 
    substring(password_hash from 1 for 15) || '...[BCRYPT_HASH]' AS password_hash_preview,
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS registered_at,
    to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS last_updated_at
FROM users
WHERE role = 'BUYER'
ORDER BY created_at DESC
LIMIT 5;

-- ---------------------------------------------------------------------
-- OPERATION 3: VERIFY SELLER ACCOUNTS IN POSTGRESQL
-- ---------------------------------------------------------------------
SELECT 
    id AS seller_id, 
    name AS store_name, 
    email, 
    role, 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS seller_registered_at
FROM users
WHERE role = 'SELLER'
ORDER BY id ASC;

-- ---------------------------------------------------------------------
-- OPERATION 4 & 5: VERIFY NEW PRODUCT ADDED BY SELLER
-- ---------------------------------------------------------------------
SELECT 
    p.id AS product_id,
    p.seller_id,
    u.name AS seller_name,
    p.name AS product_name,
    c.name AS category_name,
    p.price,
    p.stock_quantity,
    to_char(p.created_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS created_at,
    to_char(p.updated_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS updated_at
FROM products p
JOIN users u ON p.seller_id = u.id
JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC
LIMIT 5;

-- ---------------------------------------------------------------------
-- OPERATION 6: VERIFY PRODUCT EDIT & updated_at TIMESTAMP REFRESH
-- ---------------------------------------------------------------------
-- Verifies that editing a product updates updated_at without modifying created_at
SELECT 
    id,
    name,
    price,
    stock_quantity,
    created_at,
    updated_at,
    (updated_at > created_at) AS has_been_modified
FROM products
WHERE updated_at > created_at
ORDER BY updated_at DESC;

-- ---------------------------------------------------------------------
-- OPERATION 7: VERIFY DELETED PRODUCT & CATALOG INTEGRITY
-- ---------------------------------------------------------------------
-- Verifies that deleted product ID is removed from active listings
-- while historical order_items retain snapshots of product_name and unit_price
SELECT 
    oi.id AS order_item_id,
    oi.order_id,
    oi.product_id,
    oi.product_name,
    oi.unit_price,
    oi.quantity,
    oi.subtotal
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE p.id IS NULL; -- Historical items whose original listing was retired

-- ---------------------------------------------------------------------
-- OPERATION 8: VERIFY BUYER CART ITEMS IN cart_items TABLE
-- ---------------------------------------------------------------------
SELECT 
    ci.id AS cart_item_id,
    ci.buyer_id,
    u.name AS buyer_name,
    u.email AS buyer_email,
    ci.product_id,
    p.name AS product_name,
    ci.quantity,
    p.price AS current_unit_price,
    (ci.quantity * p.price) AS total_cart_line_price,
    to_char(ci.created_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS added_at
FROM cart_items ci
JOIN users u ON ci.buyer_id = u.id
JOIN products p ON ci.product_id = p.id
ORDER BY ci.created_at DESC;

-- ---------------------------------------------------------------------
-- OPERATION 9 & 10: VERIFY TRANSACTIONAL CHECKOUT, ORDERS & ORDER ITEMS
-- ---------------------------------------------------------------------
-- Master order records
SELECT 
    o.id AS order_id,
    o.buyer_id,
    u.name AS buyer_name,
    u.email AS buyer_email,
    o.total_amount,
    o.status,
    o.shipping_address,
    COUNT(oi.id) AS item_count,
    to_char(o.created_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS order_placed_at
FROM orders o
JOIN users u ON o.buyer_id = u.id
JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.name, u.email
ORDER BY o.created_at DESC
LIMIT 5;

-- Itemized details snapshot for latest order
SELECT 
    oi.id AS order_item_id,
    oi.order_id,
    oi.product_id,
    oi.seller_id,
    s.name AS seller_name,
    oi.product_name,
    oi.unit_price,
    oi.quantity,
    oi.subtotal,
    to_char(oi.created_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS item_created_at
FROM order_items oi
JOIN users s ON oi.seller_id = s.id
ORDER BY oi.id DESC
LIMIT 10;

-- Audit trail in order_status_history
SELECT 
    osh.id AS history_id,
    osh.order_id,
    osh.old_status,
    osh.new_status,
    osh.changed_by,
    u.name AS actor_name,
    u.role AS actor_role,
    to_char(osh.changed_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS transition_timestamp
FROM order_status_history osh
JOIN users u ON osh.changed_by = u.id
ORDER BY osh.changed_at DESC
LIMIT 10;

-- ---------------------------------------------------------------------
-- OPERATION 11: VERIFY VALID REVIEWS SUBMITTED BY BUYER
-- ---------------------------------------------------------------------
SELECT 
    r.id AS review_id,
    r.buyer_id,
    u.name AS buyer_name,
    r.product_id,
    p.name AS product_name,
    r.rating,
    r.comment,
    to_char(r.created_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS reviewed_at
FROM reviews r
JOIN users u ON r.buyer_id = u.id
JOIN products p ON r.product_id = p.id
ORDER BY r.created_at DESC;

-- ---------------------------------------------------------------------
-- OPERATION 12: ROLE-BASED ACCESS CONTROL AUDIT
-- ---------------------------------------------------------------------
-- Verifies users and their strict privilege roles:
-- ADMIN: Can view all tables, moderate catalog, update orders
-- SELLER: Can manage inventory & view their own sales
-- BUYER: Access restricted to storefront, cart, orders, reviews
SELECT 
    role, 
    COUNT(*) AS total_accounts,
    array_agg(email ORDER BY id LIMIT 3) AS sample_emails
FROM users
GROUP BY role
ORDER BY total_accounts DESC;

-- ---------------------------------------------------------------------
-- AGGREGATE SALES REPORT BY DATE RANGE
-- ---------------------------------------------------------------------
SELECT 
    DATE(o.created_at) AS sale_date,
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(oi.quantity) AS total_items_sold,
    SUM(o.total_amount) AS gross_revenue
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at >= '2026-09-01 00:00:00+00' 
  AND o.created_at <= '2026-10-31 23:59:59+00'
  AND o.status != 'CANCELLED'
GROUP BY DATE(o.created_at)
ORDER BY sale_date ASC;
