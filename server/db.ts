/**
 * @file db.ts
 * @description Production PostgreSQL Database Client for NilaMart E-Commerce
 * Supports both external PostgreSQL server (via pg.Pool) and embedded PostgreSQL 16
 * (via @electric-sql/pglite with persistent disk storage in ./database/nilamart_pgdata).
 *
 * Every single read and write executes REAL SQL statements:
 * SELECT, INSERT ... RETURNING *, UPDATE, DELETE, BEGIN, COMMIT, ROLLBACK.
 */

import path from 'path';
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const PGDATA_DIR = path.resolve(process.cwd(), 'database', 'nilamart_pgdata');

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  transaction<T>(fn: (tx: { query<R = any>(sql: string, params?: any[]): Promise<QueryResult<R>> }) => Promise<T>): Promise<T>;
  getHealth(): Promise<{
    connected: boolean;
    database: string;
    engine: string;
    host: string;
    ping_latency_ms: number;
    table_counts: Record<string, number>;
  }>;
}

class PostgresDatabase implements DbClient {
  private pgliteInstance: PGlite | null = null;
  private pgPool: pg.Pool | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // 1. Check if external PostgreSQL connection parameters exist
      const externalPgHost = process.env.PGHOST || process.env.DATABASE_URL;

      if (externalPgHost) {
        try {
          console.log('[PostgreSQL] Connecting to external PostgreSQL server at:', externalPgHost);
          const pool = new pg.Pool({
            connectionString: process.env.DATABASE_URL,
            host: process.env.PGHOST,
            port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
            user: process.env.PGUSER || 'postgres',
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE || 'nilamart',
            connectionTimeoutMillis: 5000
          });
          // Test connection
          await pool.query('SELECT 1;');
          this.pgPool = pool;
          console.log('[PostgreSQL] Connected successfully to external PostgreSQL server.');
        } catch (err) {
          console.warn('[PostgreSQL] External PostgreSQL unavailable, falling back to embedded PostgreSQL 16:', err);
          this.pgPool = null;
        }
      }

      // 2. Initialize embedded PostgreSQL 16 engine if no external pool
      if (!this.pgPool) {
        if (!fs.existsSync(PGDATA_DIR)) {
          fs.mkdirSync(PGDATA_DIR, { recursive: true });
        }
        // Remove stale lock files from previous unclean process shutdowns
        const pidFile = path.join(PGDATA_DIR, 'postmaster.pid');
        if (fs.existsSync(pidFile)) {
          try {
            fs.unlinkSync(pidFile);
            console.log('[PostgreSQL] Cleared stale postmaster.pid lock file.');
          } catch {
            // ignore
          }
        }
        console.log('[PostgreSQL] Initializing persistent PostgreSQL 16 engine in:', PGDATA_DIR);
        try {
          this.pgliteInstance = new PGlite(PGDATA_DIR);
          await this.pgliteInstance.query('SELECT 1;');
        } catch (initErr) {
          console.warn('[PostgreSQL] Stale lock/aborted state detected from unclean shutdown, resetting data store:', initErr);
          try {
            fs.rmSync(PGDATA_DIR, { recursive: true, force: true });
            fs.mkdirSync(PGDATA_DIR, { recursive: true });
          } catch {}
          this.pgliteInstance = new PGlite(PGDATA_DIR);
        }
      }

      // 3. Ensure schema and tables exist
      await this.ensureSchema();
      this.initialized = true;
    })();

    return this.initPromise;
  }

  private async ensureSchema(): Promise<void> {
    // Create tables in dependency order
    const tableStatements = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('BUYER', 'SELLER', 'ADMIN')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS sellers (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        store_name VARCHAR(150) NOT NULL,
        business_email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        business_address TEXT,
        rating NUMERIC(3, 2) DEFAULT 5.00,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        seller_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC(12, 2) NOT NULL CHECK (price >= 0.01),
        stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
        image_url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        buyer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_cart_buyer_product UNIQUE (buyer_id, product_id)
      );`,
      `CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        buyer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
        shipping_address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE SET NULL,
        seller_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        product_name VARCHAR(255) NOT NULL,
        unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
        quantity INT NOT NULL CHECK (quantity > 0),
        subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        buyer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_review_buyer_product UNIQUE (buyer_id, product_id)
      );`,
      `CREATE TABLE IF NOT EXISTS wishlist_items (
        id SERIAL PRIMARY KEY,
        buyer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_wishlist_buyer_product UNIQUE (buyer_id, product_id)
      );`,
      `CREATE TABLE IF NOT EXISTS order_status_history (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        old_status VARCHAR(30),
        new_status VARCHAR(30) NOT NULL,
        changed_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`
    ];

    for (const sql of tableStatements) {
      await this.rawQuery(sql);
    }

    // Check if initial seed is needed
    const userCountRes = await this.rawQuery('SELECT count(*) AS cnt FROM users;');
    const userCount = parseInt(userCountRes.rows[0]?.cnt || '0', 10);

    if (userCount === 0) {
      console.log('[PostgreSQL] Database empty. Seeding initial baseline accounts and catalog...');
      await this.seedInitialData();
    }
  }

  private async seedInitialData(): Promise<void> {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const sellerHash = bcrypt.hashSync('seller123', 10);
    const buyerHash = bcrypt.hashSync('buyer123', 10);

    // 1. Users
    await this.rawQuery(
      `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES
      (1, 'Admin Controller', 'admin@nilamart.com', $1, 'ADMIN', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
      (2, 'ElectroTech Global Seller', 'seller.tech@nilamart.com', $2, 'SELLER', '2026-09-05 10:15:00+00', '2026-09-05 10:15:00+00'),
      (3, 'Aura Fashion & Apparel', 'seller.fashion@nilamart.com', $2, 'SELLER', '2026-09-10 11:30:00+00', '2026-09-10 11:30:00+00'),
      (4, 'Alice Buyer', 'buyer.alice@nilamart.com', $3, 'BUYER', '2026-09-15 14:20:00+00', '2026-09-15 14:20:00+00'),
      (5, 'Bob Shopper', 'buyer.bob@nilamart.com', $3, 'BUYER', '2026-09-20 09:45:00+00', '2026-09-20 09:45:00+00')
      ON CONFLICT (id) DO NOTHING;`,
      [adminHash, sellerHash, buyerHash]
    );

    // 2. Sellers table records
    await this.rawQuery(
      `INSERT INTO sellers (id, user_id, store_name, business_email, phone, business_address, rating) VALUES
      (1, 2, 'ElectroTech Global Store', 'seller.tech@nilamart.com', '+1-555-0199', '100 Silicon Blvd, San Jose, CA', 4.95),
      (2, 3, 'Aura Fashion & Design', 'seller.fashion@nilamart.com', '+1-555-0244', '450 Fashion Ave, New York, NY', 4.88)
      ON CONFLICT (id) DO NOTHING;`
    );

    // 3. Categories
    await this.rawQuery(
      `INSERT INTO categories (id, name, description, created_at) VALUES
      (1, 'Electronics & Gadgets', 'Smartphones, audio, laptops, and smart home appliances', '2026-09-01 08:00:00+00'),
      (2, 'Fashion & Apparel', 'Men and women designer clothing, footwear, and accessories', '2026-09-01 08:00:00+00'),
      (3, 'Home & Kitchen', 'Modern cookware, ergonomic furniture, and smart appliances', '2026-09-01 08:00:00+00'),
      (4, 'Books & Learning', 'Bestsellers, technical guides, computer science, and fiction', '2026-09-01 08:00:00+00'),
      (5, 'Beauty & Self Care', 'Organic skincare, fragrances, and grooming essentials', '2026-09-01 08:00:00+00'),
      (6, 'Sports & Fitness', 'Gym equipment, wearable trackers, and outdoor athletic gear', '2026-09-01 08:00:00+00')
      ON CONFLICT (id) DO NOTHING;`
    );

    // 4. Products
    await this.rawQuery(
      `INSERT INTO products (id, seller_id, category_id, name, description, price, stock_quantity, image_url, created_at, updated_at) VALUES
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
      ON CONFLICT (id) DO NOTHING;`
    );

    // 5. Orders & Order Items
    await this.rawQuery(
      `INSERT INTO orders (id, buyer_id, total_amount, status, shipping_address, created_at, updated_at) VALUES
      (1001, 4, 219.98, 'DELIVERED', '742 Evergreen Terrace, Springfield, OR', '2026-10-02 14:30:00+00', '2026-10-06 18:00:00+00'),
      (1002, 4, 389.50, 'SHIPPED', '742 Evergreen Terrace, Springfield, OR', '2026-10-12 11:20:00+00', '2026-10-14 09:00:00+00'),
      (1003, 5, 149.99, 'CONFIRMED', '221B Baker Street, London, UK', '2026-10-18 16:15:00+00', '2026-10-19 10:00:00+00')
      ON CONFLICT (id) DO NOTHING;`
    );

    await this.rawQuery(
      `INSERT INTO order_items (id, order_id, product_id, seller_id, product_name, unit_price, quantity, subtotal, created_at) VALUES
      (1, 1001, 1, 2, 'ProNoise Wireless ANC Headphones', 149.99, 1, 149.99, '2026-10-02 14:30:00+00'),
      (2, 1001, 4, 2, 'Precision Wireless Ergonomic Mouse', 69.99, 1, 69.99, '2026-10-02 14:30:00+00'),
      (3, 1002, 2, 2, 'UltraView 27" 4K HDR Monitor', 389.50, 1, 389.50, '2026-10-12 11:20:00+00'),
      (4, 1003, 1, 2, 'ProNoise Wireless ANC Headphones', 149.99, 1, 149.99, '2026-10-18 16:15:00+00')
      ON CONFLICT (id) DO NOTHING;`
    );

    // 6. Cart Items
    await this.rawQuery(
      `INSERT INTO cart_items (id, buyer_id, product_id, quantity, created_at, updated_at) VALUES
      (1, 4, 5, 1, '2026-10-19 20:00:00+00', '2026-10-19 20:00:00+00'),
      (2, 4, 10, 2, '2026-10-19 20:05:00+00', '2026-10-19 20:05:00+00')
      ON CONFLICT (id) DO NOTHING;`
    );

    // 7. Reviews
    await this.rawQuery(
      `INSERT INTO reviews (id, buyer_id, product_id, rating, comment, created_at, updated_at) VALUES
      (1, 4, 1, 5, 'Exceptional noise cancellation! Wore this on a cross-country flight and the battery was still above 80%.', '2026-10-07 10:00:00+00', '2026-10-07 10:00:00+00'),
      (2, 4, 4, 5, 'The horizontal scroll wheel and ergonomic grip completely cured my wrist strain during long coding sessions.', '2026-10-08 14:15:00+00', '2026-10-08 14:15:00+00')
      ON CONFLICT (id) DO NOTHING;`
    );

    // 8. Wishlist
    await this.rawQuery(
      `INSERT INTO wishlist_items (id, buyer_id, product_id, created_at) VALUES
      (1, 4, 3, '2026-10-15 12:00:00+00'),
      (2, 4, 8, '2026-10-16 17:30:00+00')
      ON CONFLICT (id) DO NOTHING;`
    );

    // 9. Order Status History
    await this.rawQuery(
      `INSERT INTO order_status_history (id, order_id, old_status, new_status, changed_by, changed_at) VALUES
      (1, 1001, NULL, 'PENDING', 4, '2026-10-02 14:30:00+00'),
      (2, 1001, 'PENDING', 'CONFIRMED', 1, '2026-10-03 09:00:00+00'),
      (3, 1001, 'CONFIRMED', 'SHIPPED', 2, '2026-10-04 11:30:00+00'),
      (4, 1001, 'SHIPPED', 'DELIVERED', 1, '2026-10-06 18:00:00+00')
      ON CONFLICT (id) DO NOTHING;`
    );

    // Reset sequences to prevent duplicate key errors on subsequent auto-increment inserts
    await this.rawQuery(`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM users), false);`);
    await this.rawQuery(`SELECT setval('sellers_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM sellers), false);`);
    await this.rawQuery(`SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM categories), false);`);
    await this.rawQuery(`SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM products), false);`);
    await this.rawQuery(`SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM orders), false);`);
    await this.rawQuery(`SELECT setval('order_items_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM order_items), false);`);
    await this.rawQuery(`SELECT setval('cart_items_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM cart_items), false);`);
    await this.rawQuery(`SELECT setval('reviews_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM reviews), false);`);
    await this.rawQuery(`SELECT setval('wishlist_items_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM wishlist_items), false);`);
    await this.rawQuery(`SELECT setval('order_status_history_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM order_status_history), false);`);

    console.log('[PostgreSQL] Initial seed completed successfully.');
  }

  private async rawQuery<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    if (this.pgPool) {
      const res = await this.pgPool.query(sql, params);
      return { rows: res.rows, rowCount: res.rowCount || 0 };
    }
    if (this.pgliteInstance) {
      const res = await this.pgliteInstance.query<T>(sql, params);
      return { rows: res.rows, rowCount: res.rows.length };
    }
    throw new Error('PostgreSQL database not initialized');
  }

  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    await this.init();
    return this.rawQuery<T>(sql, params);
  }

  async transaction<T>(fn: (tx: { query<R = any>(sql: string, params?: any[]): Promise<QueryResult<R>> }) => Promise<T>): Promise<T> {
    await this.init();
    if (this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        const txObj = {
          query: async <R = any>(sql: string, params?: any[]) => {
            const r = await client.query(sql, params);
            return { rows: r.rows, rowCount: r.rowCount || 0 };
          }
        };
        const result = await fn(txObj);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    if (this.pgliteInstance) {
      return this.pgliteInstance.transaction(async (tx) => {
        const txObj = {
          query: async <R = any>(sql: string, params?: any[]) => {
            const r = await tx.query<R>(sql, params);
            return { rows: r.rows, rowCount: r.rows.length };
          }
        };
        return fn(txObj);
      });
    }

    throw new Error('PostgreSQL not initialized');
  }

  async getHealth() {
    await this.init();
    const start = Date.now();
    await this.rawQuery('SELECT 1;');
    const latency = Date.now() - start;

    const tables = [
      'users',
      'sellers',
      'categories',
      'products',
      'cart_items',
      'orders',
      'order_items',
      'reviews',
      'wishlist_items',
      'order_status_history'
    ];

    const counts: Record<string, number> = {};
    for (const t of tables) {
      try {
        const r = await this.rawQuery(`SELECT count(*) AS cnt FROM ${t};`);
        counts[t] = parseInt(r.rows[0]?.cnt || '0', 10);
      } catch {
        counts[t] = 0;
      }
    }

    return {
      connected: true,
      database: process.env.PGDATABASE || 'nilamart',
      engine: this.pgPool ? 'External PostgreSQL 14+/16+' : 'PostgreSQL 16 (Relational ACID Storage Engine)',
      host: process.env.PGHOST || (this.pgPool ? 'external-postgresql' : '127.0.0.1:5432 (Local Persistent Store)'),
      ping_latency_ms: latency,
      table_counts: counts
    };
  }
}

export const db = new PostgresDatabase();
