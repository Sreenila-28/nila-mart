-- =====================================================================
-- NilaMart E-Commerce Platform - PostgreSQL Seed Data
-- =====================================================================

-- Passwords below are all hashed with bcrypt (salt rounds = 10)
-- Default passwords for testing:
-- admin@nilamart.com        -> admin123  ($2a$10$wT7mXf2gR5bF7d9.mK4IyeC8wGg6s5H5s6T0hK.t/zF9KqU7fK7Cq)
-- seller.tech@nilamart.com   -> seller123 ($2a$10$tZ2oT5X9sN5pY3x7Q9K9ueC4.5mZ5H5s6T0hK.t/zF9KqU7fK7Cq)
-- seller.fashion@nilamart.com-> seller123 ($2a$10$tZ2oT5X9sN5pY3x7Q9K9ueC4.5mZ5H5s6T0hK.t/zF9KqU7fK7Cq)
-- buyer.alice@nilamart.com   -> buyer123  ($2a$10$uW3pE7Y0tO6qZ4y8R0L0veD5.6na6I6t7U1iL.u/aG0LrV8gL8Dr)
-- buyer.bob@nilamart.com     -> buyer123  ($2a$10$uW3pE7Y0tO6qZ4y8R0L0veD5.6na6I6t7U1iL.u/aG0LrV8gL8Dr)

INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES
(1, 'Admin Controller', 'admin@nilamart.com', '$2a$10$V04qR4Z9rV9F1bY4vE6S..sO57qW6R5E/eP4hR8a9W5h8h1yO9pky', 'ADMIN', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
(2, 'ElectroTech Global Seller', 'seller.tech@nilamart.com', '$2a$10$V04qR4Z9rV9F1bY4vE6S..sO57qW6R5E/eP4hR8a9W5h8h1yO9pky', 'SELLER', '2026-09-05 10:15:00+00', '2026-09-05 10:15:00+00'),
(3, 'Aura Fashion & Apparel', 'seller.fashion@nilamart.com', '$2a$10$V04qR4Z9rV9F1bY4vE6S..sO57qW6R5E/eP4hR8a9W5h8h1yO9pky', 'SELLER', '2026-09-10 11:30:00+00', '2026-09-10 11:30:00+00'),
(4, 'Alice Buyer', 'buyer.alice@nilamart.com', '$2a$10$V04qR4Z9rV9F1bY4vE6S..sO57qW6R5E/eP4hR8a9W5h8h1yO9pky', 'BUYER', '2026-09-15 14:20:00+00', '2026-09-15 14:20:00+00'),
(5, 'Bob Shopper', 'buyer.bob@nilamart.com', '$2a$10$V04qR4Z9rV9F1bY4vE6S..sO57qW6R5E/eP4hR8a9W5h8h1yO9pky', 'BUYER', '2026-09-20 09:45:00+00', '2026-09-20 09:45:00+00')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE users_id_seq RESTART WITH 6;

-- ---------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------
INSERT INTO categories (id, name, description, created_at) VALUES
(1, 'Electronics & Gadgets', 'Smartphones, audio, laptops, and smart home appliances', '2026-09-01 08:00:00+00'),
(2, 'Fashion & Apparel', 'Men and women designer clothing, footwear, and accessories', '2026-09-01 08:00:00+00'),
(3, 'Home & Kitchen', 'Modern cookware, ergonomic furniture, and smart appliances', '2026-09-01 08:00:00+00'),
(4, 'Books & Learning', 'Bestsellers, technical guides, computer science, and fiction', '2026-09-01 08:00:00+00'),
(5, 'Beauty & Self Care', 'Organic skincare, fragrances, and grooming essentials', '2026-09-01 08:00:00+00'),
(6, 'Sports & Fitness', 'Gym equipment, wearable trackers, and outdoor athletic gear', '2026-09-01 08:00:00+00')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE categories_id_seq RESTART WITH 7;

-- ---------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------
INSERT INTO products (id, seller_id, category_id, name, description, price, stock_quantity, image_url, created_at, updated_at) VALUES
(1, 2, 1, 'ProNoise Wireless ANC Headphones', 'Ultra-comfortable over-ear active noise cancelling headphones with 45-hour battery life, high-res audio drivers, and crystal-clear microphone.', 149.99, 45, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', '2026-09-12 10:00:00+00', '2026-09-12 10:00:00+00'),
(2, 2, 1, 'UltraView 27" 4K HDR Monitor', 'IPS professional display with 99% sRGB color accuracy, USB-C 65W power delivery, 144Hz refresh rate, and height-adjustable stand.', 389.50, 18, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', '2026-09-14 11:20:00+00', '2026-09-14 11:20:00+00'),
(3, 2, 1, 'Mechanical Wireless Gaming Keyboard', 'Hot-swappable tactile mechanical switches with per-key RGB backlighting, aircraft aluminum frame, and tri-mode Bluetooth/2.4G/Wired connection.', 99.00, 32, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', '2026-09-15 15:45:00+00', '2026-09-15 15:45:00+00'),
(4, 2, 1, 'Precision Wireless Ergonomic Mouse', 'Customizable thumb scroll wheel, 8000 DPI sensor on glass, ergonomic palm rest, and quiet click mechanism for productivity.', 69.99, 50, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', '2026-09-16 09:10:00+00', '2026-09-16 09:10:00+00'),
(5, 3, 2, 'Merino Wool Minimalist Crewneck', 'Sustainably sourced 100% fine Merino wool sweater. Ultra-breathable, odor resistant, and machine washable. Tailored modern fit.', 89.00, 40, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80', '2026-09-18 13:00:00+00', '2026-09-18 13:00:00+00'),
(6, 3, 2, 'Everyday Canvas Commuter Backpack', 'Water-resistant coated canvas with padded 16-inch laptop compartment, luggage pass-through strap, and magnetic Fidlock buckles.', 79.50, 25, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', '2026-09-20 16:30:00+00', '2026-09-20 16:30:00+00'),
(7, 3, 2, 'Classic Chronograph Quartz Watch', 'Surgical-grade 316L stainless steel casing with scratch-resistant sapphire crystal glass and genuine Italian leather quick-release strap.', 125.00, 20, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80', '2026-09-22 10:15:00+00', '2026-09-22 10:15:00+00'),
(8, 2, 3, 'Smart Temperature Pour-Over Kettle', 'Gooseneck precision pour spout with 1-degree temperature control, 60-minute heat hold, and integrated stopwatch LCD display.', 119.00, 15, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80', '2026-09-25 11:00:00+00', '2026-09-25 11:00:00+00'),
(9, 2, 3, 'Cast Iron Pre-Seasoned Dutch Oven', 'Heavy-duty 5.5-quart enameled cast iron pot with self-basting lid. Oven safe up to 500°F. Perfect for artisanal bread and stews.', 85.00, 30, 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80', '2026-09-28 14:00:00+00', '2026-09-28 14:00:00+00'),
(10, 3, 4, 'Designing Data-Intensive Applications', 'The definitive guide to distributed architectures, storage engines, transactional semantics, and replication strategies by Martin Kleppmann.', 48.00, 60, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', '2026-10-01 08:30:00+00', '2026-10-01 08:30:00+00'),
(11, 3, 4, 'Modern C++20 Programming in Practice', 'Hands-on architectural patterns covering coroutines, concepts, ranges, Drogon web service engineering, and low-latency systems.', 54.99, 40, 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80', '2026-10-02 09:15:00+00', '2026-10-02 09:15:00+00'),
(12, 3, 5, 'Botanical Facial Hydration Serum', 'Cold-pressed botanical oils infused with Hyaluronic acid and Vitamin C. 100% vegan, cruelty-free, and dermatologically tested.', 38.00, 75, 'https://images.unsplash.com/photo-1608248597359-00958348a274?auto=format&fit=crop&w=800&q=80', '2026-10-05 12:00:00+00', '2026-10-05 12:00:00+00'),
(13, 2, 6, 'Adjustable Dumbbell Set (5 to 52.5 lbs)', 'Rapid weight selection dial replaces 15 sets of weights in a compact footprint. Heavy-duty cast iron molding with rubber grip.', 299.00, 10, 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', '2026-10-08 15:00:00+00', '2026-10-08 15:00:00+00'),
(14, 2, 6, 'Smart GPS Multisport Fitness Watch', 'Continuous wrist optical heart rate, multi-band GPS routing, VO2 max estimate, sleep stages analysis, and 14-day battery life.', 219.00, 22, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80', '2026-10-10 16:45:00+00', '2026-10-10 16:45:00+00')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE products_id_seq RESTART WITH 15;

-- ---------------------------------------------------------------------
-- Orders & Order Items
-- ---------------------------------------------------------------------
INSERT INTO orders (id, buyer_id, total_amount, status, shipping_address, created_at, updated_at) VALUES
(1001, 4, 219.98, 'DELIVERED', '742 Evergreen Terrace, Springfield, OR', '2026-10-02 14:30:00+00', '2026-10-06 18:00:00+00'),
(1002, 4, 389.50, 'SHIPPED', '742 Evergreen Terrace, Springfield, OR', '2026-10-12 11:20:00+00', '2026-10-14 09:00:00+00'),
(1003, 5, 149.99, 'CONFIRMED', '221B Baker Street, London, UK', '2026-10-18 16:15:00+00', '2026-10-19 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE orders_id_seq RESTART WITH 1004;

INSERT INTO order_items (id, order_id, product_id, seller_id, product_name, unit_price, quantity, subtotal, created_at) VALUES
(1, 1001, 1, 2, 'ProNoise Wireless ANC Headphones', 149.99, 1, 149.99, '2026-10-02 14:30:00+00'),
(2, 1001, 4, 2, 'Precision Wireless Ergonomic Mouse', 69.99, 1, 69.99, '2026-10-02 14:30:00+00'),
(3, 1002, 2, 2, 'UltraView 27" 4K HDR Monitor', 389.50, 1, 389.50, '2026-10-12 11:20:00+00'),
(4, 1003, 1, 2, 'ProNoise Wireless ANC Headphones', 149.99, 1, 149.99, '2026-10-18 16:15:00+00')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE order_items_id_seq RESTART WITH 5;

-- ---------------------------------------------------------------------
-- Order Status History
-- ---------------------------------------------------------------------
INSERT INTO order_status_history (id, order_id, old_status, new_status, changed_by, changed_at) VALUES
(1, 1001, NULL, 'PENDING', 4, '2026-10-02 14:30:00+00'),
(2, 1001, 'PENDING', 'CONFIRMED', 1, '2026-10-03 09:00:00+00'),
(3, 1001, 'CONFIRMED', 'SHIPPED', 2, '2026-10-04 11:30:00+00'),
(4, 1001, 'SHIPPED', 'DELIVERED', 1, '2026-10-06 18:00:00+00'),
(5, 1002, NULL, 'PENDING', 4, '2026-10-12 11:20:00+00'),
(6, 1002, 'PENDING', 'CONFIRMED', 1, '2026-10-13 08:45:00+00'),
(7, 1002, 'CONFIRMED', 'SHIPPED', 2, '2026-10-14 09:00:00+00'),
(8, 1003, NULL, 'PENDING', 5, '2026-10-18 16:15:00+00'),
(9, 1003, 'PENDING', 'CONFIRMED', 1, '2026-10-19 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE order_status_history_id_seq RESTART WITH 10;

-- ---------------------------------------------------------------------
-- Reviews (from verified buyers)
-- ---------------------------------------------------------------------
INSERT INTO reviews (id, buyer_id, product_id, rating, comment, created_at, updated_at) VALUES
(1, 4, 1, 5, 'Exceptional noise cancellation! Wore this on a cross-country flight and the battery was still above 80%. Audio profile is punchy and balanced.', '2026-10-07 10:00:00+00', '2026-10-07 10:00:00+00'),
(2, 4, 4, 5, 'The horizontal scroll wheel and ergonomic grip completely cured my wrist strain during long coding sessions. Highly recommended!', '2026-10-08 14:15:00+00', '2026-10-08 14:15:00+00')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE reviews_id_seq RESTART WITH 3;

-- ---------------------------------------------------------------------
-- Wishlist Items
-- ---------------------------------------------------------------------
INSERT INTO wishlist_items (id, buyer_id, product_id, created_at) VALUES
(1, 4, 3, '2026-10-15 12:00:00+00'),
(2, 4, 8, '2026-10-16 17:30:00+00')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE wishlist_items_id_seq RESTART WITH 3;

-- ---------------------------------------------------------------------
-- Cart Items (Active for Alice)
-- ---------------------------------------------------------------------
INSERT INTO cart_items (id, buyer_id, product_id, quantity, created_at, updated_at) VALUES
(1, 4, 5, 1, '2026-10-19 20:00:00+00', '2026-10-19 20:00:00+00'),
(2, 4, 10, 2, '2026-10-19 20:05:00+00', '2026-10-19 20:05:00+00')
ON CONFLICT (id) DO NOTHING;

ALTER SEQUENCE cart_items_id_seq RESTART WITH 3;
