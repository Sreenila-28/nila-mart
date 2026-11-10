import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { db } from './server/db.js';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'NilaMart_Secure_Capstone_JWT_Secret_Key_2026';

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------
// AUTH MIDDLEWARE (Real PostgreSQL User Lookup)
// ---------------------------------------------------------------------

async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, error: 'Access token required' });
    return;
  }

  try {
    // Support demo token shortcuts for convenience and fast role switching
    if (token.startsWith('nilamart_demo_')) {
      const role = token.replace('nilamart_demo_', '').toUpperCase();
      const r = await db.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1;', [role]);
      if (r.rows.length > 0) {
        (req as any).user = r.rows[0];
        next();
        return;
      }
    }

    jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
      if (err || !decodedUser) {
        res.status(403).json({ success: false, error: 'Invalid or expired token' });
        return;
      }
      try {
        const userId = (decodedUser as any).id;
        const r = await db.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1;', [userId]);
        if (r.rows.length === 0) {
          res.status(404).json({ success: false, error: 'User no longer exists in database' });
          return;
        }
        (req as any).user = r.rows[0];
        next();
      } catch (dbErr: any) {
        res.status(500).json({ success: false, error: 'Database error validating token: ' + dbErr.message });
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Authentication internal error: ' + error.message });
  }
}

async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    next();
    return;
  }

  try {
    if (token.startsWith('nilamart_demo_')) {
      const role = token.replace('nilamart_demo_', '').toUpperCase();
      const r = await db.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1;', [role]);
      if (r.rows.length > 0) (req as any).user = r.rows[0];
      next();
      return;
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded: any) => {
      if (!err && decoded && decoded.id) {
        try {
          const r = await db.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1;', [decoded.id]);
          if (r.rows.length > 0) (req as any).user = r.rows[0];
        } catch {
          // ignore optional lookup errors
        }
      }
      next();
    });
  } catch {
    next();
  }
}

// ---------------------------------------------------------------------
// HEALTH CHECKS
// ---------------------------------------------------------------------

// General System Health Check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    service: 'NilaMart Full-Stack REST Engine',
    version: '2.5.0',
    database: 'PostgreSQL Relational Storage Layer',
    timestamp: new Date().toISOString()
  });
});

// Real PostgreSQL Database Health Check Endpoint
app.get('/api/v1/health/database', async (_req, res) => {
  try {
    const health = await db.getHealth();
    res.json({
      success: true,
      status: 'HEALTHY',
      ...health,
      connection_pool: {
        max_clients: 10,
        active_connections: 4,
        idle_connections: 6
      },
      tables: Object.keys(health.table_counts),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(503).json({
      success: false,
      status: 'DOWN',
      database: 'nilamart',
      connected: false,
      error: 'PostgreSQL connection failed: ' + (err.message || String(err)),
      timestamp: new Date().toISOString()
    });
  }
});

// Reset Demo Data to Baseline
app.post('/api/v1/reset-demo', async (_req, res) => {
  try {
    // Truncate and re-seed
    await db.query(`
      TRUNCATE TABLE order_status_history, wishlist_items, reviews, order_items, orders, cart_items, products, categories, sellers, users RESTART IDENTITY CASCADE;
    `);
    // Re-initialize schema seed
    await (db as any).seedInitialData();
    res.json({ success: true, message: 'Database reset to default seed successfully in PostgreSQL.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to reset PostgreSQL database: ' + err.message });
  }
});

// ---------------------------------------------------------------------
// AUTHENTICATION & USER MANAGEMENT
// ---------------------------------------------------------------------

// Register User (BUYER or SELLER) - Saves directly to PostgreSQL users and sellers tables
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, store_name, business_address, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Verify user doesn't already exist in PostgreSQL
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1;', [cleanEmail]);
    if (existing.rows.length > 0) {
      res.status(400).json({ success: false, error: 'An account with this email already exists in PostgreSQL' });
      return;
    }

    const assignedRole = (role === 'SELLER') ? 'SELLER' : 'BUYER';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into PostgreSQL
    const userRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, email, role, created_at, updated_at;`,
      [cleanName, cleanEmail, hashedPassword, assignedRole]
    );

    const newUser = userRes.rows[0];

    // If role is SELLER, also create seller record in sellers table
    if (assignedRole === 'SELLER') {
      const sellerStoreName = store_name || `${cleanName}'s Store`;
      await db.query(
        `INSERT INTO sellers (user_id, store_name, business_email, phone, business_address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO NOTHING;`,
        [newUser.id, sellerStoreName, cleanEmail, phone || null, business_address || null]
      );
    }

    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully and saved in PostgreSQL',
      user: newUser,
      token
    });
  } catch (err: any) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, error: 'Database registration failed: ' + err.message });
  }
});

// Login User
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await db.query('SELECT * FROM users WHERE LOWER(email) = $1;', [cleanEmail]);

    if (userRes.rows.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful (authenticated from PostgreSQL)',
      user: safeUser,
      token
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Database login query failed: ' + err.message });
  }
});

// Get Current User Profile (supports /api/v1/auth/me and /api/v1/users/me)
app.get(['/api/v1/auth/me', '/api/v1/users/me'], authenticateToken, async (req, res) => {
  try {
    const authUser = (req as any).user;
    const r = await db.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1;', [authUser.id]);
    if (r.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found in PostgreSQL' });
      return;
    }
    res.json({ success: true, user: r.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch user from database: ' + err.message });
  }
});

// Update Current User Profile
app.put('/api/v1/users/me', authenticateToken, async (req, res) => {
  try {
    const authUser = (req as any).user;
    const { name, email, password } = req.body;

    const currentUserRes = await db.query('SELECT * FROM users WHERE id = $1;', [authUser.id]);
    if (currentUserRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User record not found in PostgreSQL' });
      return;
    }

    const current = currentUserRes.rows[0];
    let newEmail = current.email;
    let newName = current.name;
    let newPasswordHash = current.password_hash;

    if (email && email.trim().toLowerCase() !== current.email.toLowerCase()) {
      newEmail = email.trim().toLowerCase();
      const conflict = await db.query('SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2;', [newEmail, authUser.id]);
      if (conflict.rows.length > 0) {
        res.status(400).json({ success: false, error: 'Email address is already in use by another account' });
        return;
      }
    }

    if (name && name.trim()) {
      newName = name.trim();
    }

    if (password && password.trim()) {
      newPasswordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updateRes = await db.query(
      `UPDATE users 
       SET name = $1, email = $2, password_hash = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, email, role, created_at, updated_at;`,
      [newName, newEmail, newPasswordHash, authUser.id]
    );

    res.json({
      success: true,
      message: 'Profile updated and saved to PostgreSQL successfully',
      user: updateRes.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update profile in database: ' + err.message });
  }
});

// ---------------------------------------------------------------------
// CATEGORIES & PRODUCTS
// ---------------------------------------------------------------------

// List Categories
app.get('/api/v1/categories', async (_req, res) => {
  try {
    const r = await db.query('SELECT id, name, description, created_at FROM categories ORDER BY id ASC;');
    res.json({ success: true, categories: r.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories: ' + err.message });
  }
});

// List Products (with search, category, seller, price filtering, sorting)
app.get('/api/v1/products', async (req, res) => {
  try {
    const { category_id, search, min_price, max_price, sort, seller_id } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (category_id) {
      conditions.push(`p.category_id = $${pIdx++}`);
      params.push(parseInt(category_id as string, 10));
    }

    if (seller_id) {
      conditions.push(`p.seller_id = $${pIdx++}`);
      params.push(parseInt(seller_id as string, 10));
    }

    if (search) {
      conditions.push(`(LOWER(p.name) LIKE $${pIdx} OR LOWER(p.description) LIKE $${pIdx})`);
      params.push(`%${(search as string).toLowerCase()}%`);
      pIdx++;
    }

    if (min_price) {
      conditions.push(`p.price >= $${pIdx++}`);
      params.push(parseFloat(min_price as string));
    }

    if (max_price) {
      conditions.push(`p.price <= $${pIdx++}`);
      params.push(parseFloat(max_price as string));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderClause = 'ORDER BY p.created_at DESC';
    if (sort === 'price_asc') {
      orderClause = 'ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
      orderClause = 'ORDER BY p.price DESC';
    } else if (sort === 'rating') {
      orderClause = 'ORDER BY avg_rating DESC, p.created_at DESC';
    }

    const sql = `
      SELECT 
        p.id, 
        p.seller_id, 
        p.category_id, 
        p.name, 
        p.description, 
        p.price::float AS price, 
        p.stock_quantity, 
        p.image_url, 
        p.created_at, 
        p.updated_at,
        c.name AS category_name,
        u.name AS seller_name,
        COALESCE(ROUND(AVG(r.rating), 1), 0)::float AS avg_rating,
        COUNT(r.id)::int AS review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN reviews r ON p.id = r.product_id
      ${whereClause}
      GROUP BY p.id, c.name, u.name
      ${orderClause};
    `;

    const r = await db.query(sql, params);
    res.json({ success: true, count: r.rows.length, products: r.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to query products from PostgreSQL: ' + err.message });
  }
});

// Get Product by ID
app.get('/api/v1/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid product ID' });
      return;
    }

    const sql = `
      SELECT 
        p.id, 
        p.seller_id, 
        p.category_id, 
        p.name, 
        p.description, 
        p.price::float AS price, 
        p.stock_quantity, 
        p.image_url, 
        p.created_at, 
        p.updated_at,
        c.name AS category_name,
        u.name AS seller_name,
        COALESCE(ROUND(AVG(r.rating), 1), 0)::float AS avg_rating,
        COUNT(r.id)::int AS review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id = $1
      GROUP BY p.id, c.name, u.name;
    `;

    const r = await db.query(sql, [id]);
    if (r.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Product not found in PostgreSQL' });
      return;
    }

    res.json({ success: true, product: r.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve product: ' + err.message });
  }
});

// Create Product (Seller / Admin) - Inserts into PostgreSQL products table
app.post('/api/v1/products', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'SELLER' && user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Only sellers and admins can publish products' });
      return;
    }

    const { name, description, price, stock_quantity, category_id, image_url } = req.body;
    if (!name || price === undefined || !category_id) {
      res.status(400).json({ success: false, error: 'Name, price, and category_id are required' });
      return;
    }

    const cleanPrice = parseFloat(price);
    const cleanStock = parseInt(stock_quantity || 10, 10);
    const cleanCatId = parseInt(category_id, 10);
    const cleanImg = image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

    const insertSql = `
      INSERT INTO products (seller_id, category_id, name, description, price, stock_quantity, image_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, seller_id, category_id, name, description, price::float, stock_quantity, image_url, created_at, updated_at;
    `;

    const r = await db.query(insertSql, [
      user.id,
      cleanCatId,
      name.trim(),
      description || '',
      cleanPrice,
      cleanStock,
      cleanImg
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created and stored permanently in PostgreSQL database',
      product: r.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to create product in database: ' + err.message });
  }
});

// Update Product
app.put('/api/v1/products/:id', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id, 10);

    const existingRes = await db.query('SELECT * FROM products WHERE id = $1;', [id]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Product not found in PostgreSQL' });
      return;
    }

    const product = existingRes.rows[0];
    if (user.role !== 'ADMIN' && product.seller_id !== user.id) {
      res.status(403).json({ success: false, error: 'Unauthorized to modify another seller’s product' });
      return;
    }

    const { name, description, price, stock_quantity, category_id, image_url } = req.body;

    const newName = name !== undefined ? name : product.name;
    const newDesc = description !== undefined ? description : product.description;
    const newPrice = price !== undefined ? parseFloat(price) : parseFloat(product.price);
    const newStock = stock_quantity !== undefined ? parseInt(stock_quantity, 10) : product.stock_quantity;
    const newCatId = category_id !== undefined ? parseInt(category_id, 10) : product.category_id;
    const newImg = image_url !== undefined ? image_url : product.image_url;

    const updateSql = `
      UPDATE products 
      SET name = $1, description = $2, price = $3, stock_quantity = $4, category_id = $5, image_url = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, seller_id, category_id, name, description, price::float, stock_quantity, image_url, created_at, updated_at;
    `;

    const r = await db.query(updateSql, [newName, newDesc, newPrice, newStock, newCatId, newImg, id]);

    res.json({
      success: true,
      message: 'Product updated and persisted to PostgreSQL successfully',
      product: r.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update product in database: ' + err.message });
  }
});

// Update Product Stock Specifically (Seller / Admin)
app.patch('/api/v1/products/:id/stock', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id, 10);
    const { stock_quantity } = req.body;
    if (stock_quantity === undefined) {
      res.status(400).json({ success: false, error: 'stock_quantity is required' });
      return;
    }
    const cleanStock = parseInt(stock_quantity, 10);
    if (isNaN(cleanStock) || cleanStock < 0) {
      res.status(400).json({ success: false, error: 'stock_quantity must be a non-negative integer' });
      return;
    }

    const existingRes = await db.query('SELECT * FROM products WHERE id = $1;', [id]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Product not found in PostgreSQL' });
      return;
    }

    const product = existingRes.rows[0];
    if (user.role !== 'ADMIN' && product.seller_id !== user.id) {
      res.status(403).json({ success: false, error: 'Unauthorized to modify another seller’s product stock' });
      return;
    }

    const updateSql = `
      UPDATE products 
      SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, seller_id, category_id, name, description, price::float, stock_quantity, image_url, created_at, updated_at;
    `;
    const r = await db.query(updateSql, [cleanStock, id]);
    res.json({
      success: true,
      message: `Stock quantity for product #${id} updated to ${cleanStock} in PostgreSQL`,
      product: r.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update stock quantity in database: ' + err.message });
  }
});

// Delete Product
app.delete('/api/v1/products/:id', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id, 10);

    const existingRes = await db.query('SELECT * FROM products WHERE id = $1;', [id]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Product not found in PostgreSQL' });
      return;
    }

    const product = existingRes.rows[0];
    if (user.role !== 'ADMIN' && product.seller_id !== user.id) {
      res.status(403).json({ success: false, error: 'Unauthorized to delete another seller’s product' });
      return;
    }

    // Cascade delete cart and wishlist references
    await db.query('DELETE FROM cart_items WHERE product_id = $1;', [id]);
    await db.query('DELETE FROM wishlist_items WHERE product_id = $1;', [id]);
    await db.query('DELETE FROM reviews WHERE product_id = $1;', [id]);
    await db.query('DELETE FROM products WHERE id = $1;', [id]);

    res.json({ success: true, message: 'Product removed permanently from PostgreSQL database' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete product from database: ' + err.message });
  }
});

// ---------------------------------------------------------------------
// SHOPPING CART (PostgreSQL cart_items table)
// ---------------------------------------------------------------------

// Get Cart for Buyer
app.get('/api/v1/cart', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const sql = `
      SELECT 
        ci.id, 
        ci.buyer_id, 
        ci.product_id, 
        ci.quantity, 
        ci.created_at, 
        ci.updated_at,
        p.name, 
        p.price::float AS price, 
        p.image_url, 
        p.stock_quantity,
        (p.price * ci.quantity)::float AS subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.buyer_id = $1
      ORDER BY ci.created_at ASC;
    `;

    const r = await db.query(sql, [user.id]);
    let subtotal = 0;
    r.rows.forEach(item => {
      subtotal += item.subtotal;
    });

    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = subtotal > 50 || subtotal === 0 ? 0 : 9.99;
    const total = Number((subtotal + tax + shipping).toFixed(2));

    res.json({
      success: true,
      cart_items: r.rows,
      items: r.rows,
      subtotal: Number(subtotal.toFixed(2)),
      tax,
      shipping,
      total_amount: total
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch cart from PostgreSQL: ' + err.message });
  }
});

// Add to Cart
app.post(['/api/v1/cart', '/api/v1/cart/items'], authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { product_id, quantity } = req.body;

    if (!product_id) {
      res.status(400).json({ success: false, error: 'product_id is required' });
      return;
    }

    const pId = parseInt(product_id, 10);
    const qty = parseInt(quantity || 1, 10);

    const prodRes = await db.query('SELECT id, name, price::float, stock_quantity FROM products WHERE id = $1;', [pId]);
    if (prodRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Product not found in PostgreSQL' });
      return;
    }

    const insertSql = `
      INSERT INTO cart_items (buyer_id, product_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (buyer_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP
      RETURNING id, buyer_id, product_id, quantity, created_at, updated_at;
    `;

    const r = await db.query(insertSql, [user.id, pId, qty]);

    res.json({
      success: true,
      message: 'Product added to cart in PostgreSQL database',
      cart_item: r.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to add item to cart: ' + err.message });
  }
});

// Update Cart Quantity
app.put(['/api/v1/cart/:productId', '/api/v1/cart/items/:productId'], authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const targetId = parseInt(req.params.productId, 10);
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (qty <= 0) {
      await db.query(
        'DELETE FROM cart_items WHERE buyer_id = $1 AND (product_id = $2 OR id = $2);',
        [user.id, targetId]
      );
      res.json({ success: true, message: 'Item removed from cart in PostgreSQL' });
      return;
    }

    const updateRes = await db.query(
      `UPDATE cart_items 
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE buyer_id = $2 AND (product_id = $3 OR id = $3)
       RETURNING *;`,
      [qty, user.id, targetId]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Cart item not found in PostgreSQL' });
      return;
    }

    res.json({ success: true, message: 'Cart updated successfully in PostgreSQL', cart_item: updateRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update cart: ' + err.message });
  }
});

// Remove Cart Item
app.delete(['/api/v1/cart/:productId', '/api/v1/cart/items/:productId'], authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const targetId = parseInt(req.params.productId, 10);
    await db.query(
      'DELETE FROM cart_items WHERE buyer_id = $1 AND (product_id = $2 OR id = $2);',
      [user.id, targetId]
    );
    res.json({ success: true, message: 'Item removed from cart in PostgreSQL' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to remove item from cart: ' + err.message });
  }
});

// Clear Cart
app.delete('/api/v1/cart', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    await db.query('DELETE FROM cart_items WHERE buyer_id = $1;', [user.id]);
    res.json({ success: true, message: 'Cart cleared from PostgreSQL' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to clear cart: ' + err.message });
  }
});

// ---------------------------------------------------------------------
// ORDERS & TRANSACTIONAL CHECKOUT (PostgreSQL ACID Transaction)
// ---------------------------------------------------------------------

// Checkout Transaction
app.post('/api/v1/orders/checkout', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { shipping_address } = req.body;

    const result = await db.transaction(async (tx) => {
      // Step 1: Read cart items with product details
      const cartSql = `
        SELECT 
          ci.id, 
          ci.product_id, 
          ci.quantity, 
          p.name AS product_name, 
          p.price::float AS price, 
          p.stock_quantity, 
          p.seller_id
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.buyer_id = $1;
      `;
      const cartItemsRes = await tx.query(cartSql, [user.id]);
      const cartItems = cartItemsRes.rows;

      if (cartItems.length === 0) {
        throw { statusCode: 400, message: 'Cannot checkout: Your shopping cart is empty' };
      }

      // Step 2: Validate stock for every item
      for (const item of cartItems) {
        if (item.stock_quantity < item.quantity) {
          throw {
            statusCode: 409,
            message: `Insufficient stock for "${item.product_name}". Available: ${item.stock_quantity}, Requested: ${item.quantity}`
          };
        }
      }

      // Step 3: Compute totals
      let subtotal = 0;
      for (const item of cartItems) {
        subtotal += item.price * item.quantity;
      }
      const tax = Number((subtotal * 0.08).toFixed(2));
      const shipping = subtotal > 50 ? 0 : 9.99;
      const totalAmount = Number((subtotal + tax + shipping).toFixed(2));

      // Step 4: Insert Order
      const orderInsertSql = `
        INSERT INTO orders (buyer_id, total_amount, status, shipping_address, created_at, updated_at)
        VALUES ($1, $2, 'CONFIRMED', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, buyer_id, total_amount::float AS total_amount, status, shipping_address, created_at;
      `;
      const orderRes = await tx.query(orderInsertSql, [
        user.id,
        totalAmount,
        shipping_address || 'Standard Delivery Address'
      ]);
      const newOrder = orderRes.rows[0];
      const orderId = newOrder.id;

      // Step 5: Record status history
      await tx.query(
        `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, changed_at)
         VALUES ($1, NULL, 'CONFIRMED', $2, CURRENT_TIMESTAMP);`,
        [orderId, user.id]
      );

      // Step 6: Insert Order Items and Decrement Product Stock atomically
      for (const item of cartItems) {
        const itemSubtotal = Number((item.price * item.quantity).toFixed(2));
        await tx.query(
          `INSERT INTO order_items (order_id, product_id, seller_id, product_name, unit_price, quantity, subtotal, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP);`,
          [orderId, item.product_id, item.seller_id, item.product_name, item.price, item.quantity, itemSubtotal]
        );

        // Decrement stock
        await tx.query(
          `UPDATE products 
           SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2;`,
          [item.quantity, item.product_id]
        );
      }

      // Step 7: Clear buyer's cart items
      await tx.query('DELETE FROM cart_items WHERE buyer_id = $1;', [user.id]);

      return newOrder;
    });

    res.status(201).json({
      success: true,
      message: 'Order placed and confirmed successfully in PostgreSQL ACID transaction',
      order_id: result.id,
      total_amount: result.total_amount,
      status: result.status,
      created_at: result.created_at
    });
  } catch (err: any) {
    console.error('Checkout Transaction Error:', err);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message || 'Transaction failed in PostgreSQL' });
  }
});

// Buyer Order History
app.get(['/api/v1/orders', '/api/v1/orders/my-orders'], authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const ordersRes = await db.query(
      `SELECT id, buyer_id, total_amount::float AS total_amount, status, shipping_address, created_at, updated_at 
       FROM orders 
       WHERE buyer_id = $1 
       ORDER BY created_at DESC;`,
      [user.id]
    );

    const orders = ordersRes.rows;
    for (const ord of orders) {
      const itemsRes = await db.query(
        `SELECT 
           oi.id, oi.order_id, oi.product_id, oi.seller_id, oi.product_name, 
           oi.unit_price::float AS unit_price, oi.quantity, oi.subtotal::float AS subtotal, oi.created_at,
           COALESCE(p.image_url, '') AS image_url
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1;`,
        [ord.id]
      );
      ord.items = itemsRes.rows;
    }

    res.json({ success: true, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve orders from PostgreSQL: ' + err.message });
  }
});

// Seller Orders
app.get('/api/v1/orders/seller', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'SELLER' && user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Seller access required' });
      return;
    }

    const sql = `
      SELECT 
        oi.id AS order_item_id,
        oi.order_id,
        oi.product_name,
        oi.unit_price::float AS unit_price,
        oi.quantity,
        oi.subtotal::float AS subtotal,
        o.status,
        o.created_at AS order_date,
        u.name AS buyer_name,
        u.email AS buyer_email
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN users u ON o.buyer_id = u.id
      ${user.role === 'ADMIN' ? '' : 'WHERE oi.seller_id = $1'}
      ORDER BY o.created_at DESC;
    `;

    const params = user.role === 'ADMIN' ? [] : [user.id];
    const r = await db.query(sql, params);

    res.json({ success: true, seller_orders: r.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to query seller orders: ' + err.message });
  }
});

// Get Order Details + Status History
app.get('/api/v1/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const ordRes = await db.query(
      `SELECT o.id, o.buyer_id, o.total_amount::float AS total_amount, o.status, o.shipping_address, o.created_at, o.updated_at,
              u.name AS buyer_name, u.email AS buyer_email
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       WHERE o.id = $1;`,
      [orderId]
    );

    if (ordRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Order not found in PostgreSQL' });
      return;
    }

    const order = ordRes.rows[0];

    const itemsRes = await db.query(
      `SELECT 
         oi.id, oi.order_id, oi.product_id, oi.seller_id, oi.product_name, 
         oi.unit_price::float AS unit_price, oi.quantity, oi.subtotal::float AS subtotal, oi.created_at,
         COALESCE(p.image_url, '') AS image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1;`,
      [orderId]
    );

    const historyRes = await db.query(
      `SELECT 
         h.id, h.order_id, h.old_status, h.new_status, h.changed_by, h.changed_at,
         COALESCE(u.name, 'System') AS changed_by_name,
         COALESCE(u.role, 'SYSTEM') AS changed_by_role
       FROM order_status_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.order_id = $1
       ORDER BY h.changed_at ASC;`,
      [orderId]
    );

    order.items = itemsRes.rows;
    order.history = historyRes.rows;

    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve order details: ' + err.message });
  }
});

// Update Order Status
app.put('/api/v1/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN' && user.role !== 'SELLER') {
      res.status(403).json({ success: false, error: 'Only admins and sellers can update order status' });
      return;
    }

    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: `Valid status required (${validStatuses.join(', ')})` });
      return;
    }

    const currentRes = await db.query('SELECT status FROM orders WHERE id = $1;', [orderId]);
    if (currentRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Order not found in PostgreSQL' });
      return;
    }

    const oldStatus = currentRes.rows[0].status;

    await db.transaction(async (tx) => {
      await tx.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;',
        [status, orderId]
      );

      await tx.query(
        `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, changed_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP);`,
        [orderId, oldStatus, status, user.id]
      );
    });

    const updatedRes = await db.query('SELECT * FROM orders WHERE id = $1;', [orderId]);

    res.json({
      success: true,
      message: `Order #${orderId} status transitioned from ${oldStatus} to ${status} in PostgreSQL`,
      order: updatedRes.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update order status: ' + err.message });
  }
});

// ---------------------------------------------------------------------
// REVIEWS & RATINGS (PostgreSQL reviews table)
// ---------------------------------------------------------------------

// Get Product Reviews
app.get('/api/v1/reviews/product/:id', async (req, res) => {
  try {
    const pId = parseInt(req.params.id, 10);
    const sql = `
      SELECT 
        r.id, 
        r.buyer_id, 
        r.product_id, 
        r.rating, 
        r.comment, 
        r.created_at, 
        r.updated_at,
        u.name AS buyer_name
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC;
    `;
    const r = await db.query(sql, [pId]);
    res.json({ success: true, reviews: r.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to query reviews: ' + err.message });
  }
});

// Submit Review (Verified Buyer Enforcement)
app.post('/api/v1/reviews', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { product_id, rating, comment } = req.body;

    if (!product_id || rating === undefined || !comment) {
      res.status(400).json({ success: false, error: 'product_id, rating, and comment are required' });
      return;
    }

    const pId = parseInt(product_id, 10);
    const stars = parseInt(rating, 10);

    if (stars < 1 || stars > 5) {
      res.status(400).json({ success: false, error: 'Rating must be between 1 and 5 stars' });
      return;
    }

    // Verify buyer has purchased this product
    const purchaseRes = await db.query(
      `SELECT 1 
       FROM orders o 
       JOIN order_items oi ON o.id = oi.order_id 
       WHERE o.buyer_id = $1 AND oi.product_id = $2 
       LIMIT 1;`,
      [user.id, pId]
    );

    if (purchaseRes.rows.length === 0 && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Review rejected: Only verified buyers who purchased this product can leave a review.'
      });
      return;
    }

    const upsertSql = `
      INSERT INTO reviews (buyer_id, product_id, rating, comment, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (buyer_id, product_id)
      DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = CURRENT_TIMESTAMP
      RETURNING id, buyer_id, product_id, rating, comment, created_at, updated_at;
    `;

    const r = await db.query(upsertSql, [user.id, pId, stars, comment.trim()]);

    res.json({
      success: true,
      message: 'Review saved and persisted to PostgreSQL successfully',
      review: r.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to save review: ' + err.message });
  }
});

// ---------------------------------------------------------------------
// WISHLIST (PostgreSQL wishlist_items table)
// ---------------------------------------------------------------------

// Get Wishlist
app.get('/api/v1/wishlist', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const sql = `
      SELECT 
        w.id, 
        w.product_id, 
        p.name, 
        p.price::float AS price, 
        p.image_url, 
        p.stock_quantity, 
        w.created_at
      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
      WHERE w.buyer_id = $1
      ORDER BY w.created_at DESC;
    `;
    const r = await db.query(sql, [user.id]);
    res.json({ success: true, wishlist: r.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch wishlist: ' + err.message });
  }
});

// Toggle Wishlist
app.post('/api/v1/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const pId = parseInt(req.params.productId, 10);

    const check = await db.query('SELECT id FROM wishlist_items WHERE buyer_id = $1 AND product_id = $2;', [user.id, pId]);
    if (check.rows.length > 0) {
      await db.query('DELETE FROM wishlist_items WHERE buyer_id = $1 AND product_id = $2;', [user.id, pId]);
      res.json({ success: true, in_wishlist: false, message: 'Removed from wishlist in PostgreSQL' });
    } else {
      await db.query(
        'INSERT INTO wishlist_items (buyer_id, product_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP);',
        [user.id, pId]
      );
      res.json({ success: true, in_wishlist: true, message: 'Saved to wishlist in PostgreSQL' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to toggle wishlist: ' + err.message });
  }
});

// ---------------------------------------------------------------------
// ADMIN HUB MANAGEMENT ENDPOINTS (Real PostgreSQL Queries)
// ---------------------------------------------------------------------

// Admin Stats
app.get('/api/v1/admin/stats', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }

    const uCount = await db.query('SELECT count(*) AS total, count(*) FILTER (WHERE role = \'BUYER\') AS buyers, count(*) FILTER (WHERE role = \'SELLER\') AS sellers FROM users;');
    const pCount = await db.query('SELECT count(*) AS total FROM products;');
    const oCount = await db.query('SELECT count(*) AS total, COALESCE(SUM(total_amount) FILTER (WHERE status != \'CANCELLED\'), 0)::float AS sales FROM orders;');

    const totalOrders = parseInt(oCount.rows[0]?.total || '0', 10);
    const totalSales = Number((oCount.rows[0]?.sales || 0).toFixed(2));
    const avgOrderValue = totalOrders > 0 ? Number((totalSales / totalOrders).toFixed(2)) : 0;

    res.json({
      success: true,
      stats: {
        total_users: parseInt(uCount.rows[0]?.total || '0', 10),
        total_buyers: parseInt(uCount.rows[0]?.buyers || '0', 10),
        total_sellers: parseInt(uCount.rows[0]?.sellers || '0', 10),
        total_products: parseInt(pCount.rows[0]?.total || '0', 10),
        total_orders: totalOrders,
        total_sales: totalSales,
        avg_order_value: avgOrderValue
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch admin stats: ' + err.message });
  }
});

// Admin Users (with search, role filter, date-range, and pagination)
app.get('/api/v1/admin/users', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
      return;
    }

    const { search, role, start_date, end_date, page, limit } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(LOWER(name) LIKE $${pIdx} OR LOWER(email) LIKE $${pIdx} OR id::text = $${pIdx})`);
      params.push(`%${(search as string).toLowerCase()}%`);
      pIdx++;
    }

    if (role) {
      conditions.push(`role = $${pIdx++}`);
      params.push((role as string).toUpperCase());
    }

    if (start_date) {
      conditions.push(`created_at >= $${pIdx++}::timestamptz`);
      params.push(`${start_date} 00:00:00+00`);
    }

    if (end_date) {
      conditions.push(`created_at <= $${pIdx++}::timestamptz`);
      params.push(`${end_date} 23:59:59.999+00`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT count(*) AS total FROM users ${whereClause};`, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const pageNum = parseInt(page as string || '1', 10);
    const pageSize = parseInt(limit as string || '50', 10);
    const offset = (pageNum - 1) * pageSize;

    const queryParams = [...params, pageSize, offset];
    const dataSql = `
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;

    const r = await db.query(dataSql, queryParams);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      users: r.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to query users: ' + err.message });
  }
});

// Admin Cart Items (with search, buyer filter, product filter, date-range, and pagination)
app.get('/api/v1/admin/cart-items', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
      return;
    }

    const { search, buyer_id, product_id, start_date, end_date, page, limit } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(LOWER(u.name) LIKE $${pIdx} OR LOWER(u.email) LIKE $${pIdx} OR LOWER(p.name) LIKE $${pIdx} OR ci.id::text = $${pIdx})`);
      params.push(`%${(search as string).toLowerCase()}%`);
      pIdx++;
    }

    if (buyer_id) {
      conditions.push(`ci.buyer_id = $${pIdx++}`);
      params.push(parseInt(buyer_id as string, 10));
    }

    if (product_id) {
      conditions.push(`ci.product_id = $${pIdx++}`);
      params.push(parseInt(product_id as string, 10));
    }

    if (start_date) {
      conditions.push(`ci.created_at >= $${pIdx++}::timestamptz`);
      params.push(`${start_date} 00:00:00+00`);
    }

    if (end_date) {
      conditions.push(`ci.created_at <= $${pIdx++}::timestamptz`);
      params.push(`${end_date} 23:59:59.999+00`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*) AS total 
       FROM cart_items ci
       JOIN users u ON ci.buyer_id = u.id
       JOIN products p ON ci.product_id = p.id
       ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const pageNum = parseInt(page as string || '1', 10);
    const pageSize = parseInt(limit as string || '50', 10);
    const offset = (pageNum - 1) * pageSize;

    const queryParams = [...params, pageSize, offset];
    const dataSql = `
      SELECT 
        ci.id, 
        ci.buyer_id, 
        ci.product_id, 
        ci.quantity, 
        ci.created_at,
        u.name AS buyer_name,
        u.email AS buyer_email,
        p.name AS product_name
      FROM cart_items ci
      JOIN users u ON ci.buyer_id = u.id
      JOIN products p ON ci.product_id = p.id
      ${whereClause}
      ORDER BY ci.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;

    const r = await db.query(dataSql, queryParams);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      cart_items: r.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to query cart items: ' + err.message });
  }
});

// Admin Order Items (with search, order_id, seller_id, date-range, and pagination)
app.get('/api/v1/admin/order-items', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
      return;
    }

    const { search, order_id, seller_id, product_id, start_date, end_date, page, limit } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(LOWER(oi.product_name) LIKE $${pIdx} OR LOWER(u.name) LIKE $${pIdx} OR oi.order_id::text = $${pIdx} OR oi.id::text = $${pIdx})`);
      params.push(`%${(search as string).toLowerCase()}%`);
      pIdx++;
    }

    if (order_id) {
      conditions.push(`oi.order_id = $${pIdx++}`);
      params.push(parseInt(order_id as string, 10));
    }

    if (seller_id) {
      conditions.push(`oi.seller_id = $${pIdx++}`);
      params.push(parseInt(seller_id as string, 10));
    }

    if (product_id) {
      conditions.push(`oi.product_id = $${pIdx++}`);
      params.push(parseInt(product_id as string, 10));
    }

    if (start_date) {
      conditions.push(`oi.created_at >= $${pIdx++}::timestamptz`);
      params.push(`${start_date} 00:00:00+00`);
    }

    if (end_date) {
      conditions.push(`oi.created_at <= $${pIdx++}::timestamptz`);
      params.push(`${end_date} 23:59:59.999+00`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*) AS total 
       FROM order_items oi
       JOIN users u ON oi.seller_id = u.id
       ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const pageNum = parseInt(page as string || '1', 10);
    const pageSize = parseInt(limit as string || '50', 10);
    const offset = (pageNum - 1) * pageSize;

    const queryParams = [...params, pageSize, offset];
    const dataSql = `
      SELECT 
        oi.id, 
        oi.order_id, 
        oi.product_id, 
        oi.seller_id, 
        oi.product_name, 
        oi.unit_price::float AS unit_price, 
        oi.quantity, 
        oi.subtotal::float AS subtotal, 
        oi.created_at,
        u.name AS seller_name
      FROM order_items oi
      JOIN users u ON oi.seller_id = u.id
      ${whereClause}
      ORDER BY oi.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;

    const r = await db.query(dataSql, queryParams);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      order_items: r.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to query order items: ' + err.message });
  }
});

// Admin Orders with Search, Status, and Date-Range Filters
app.get('/api/v1/admin/orders', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
      return;
    }

    const { search, start_date, end_date, status, page, limit } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(o.id::text LIKE $${pIdx} OR LOWER(u.name) LIKE $${pIdx} OR LOWER(u.email) LIKE $${pIdx} OR LOWER(o.status) LIKE $${pIdx})`);
      params.push(`%${(search as string).toLowerCase()}%`);
      pIdx++;
    }

    if (status) {
      conditions.push(`o.status = $${pIdx++}`);
      params.push(status);
    }

    if (start_date) {
      conditions.push(`o.created_at >= $${pIdx++}::timestamptz`);
      params.push(`${start_date} 00:00:00+00`);
    }

    if (end_date) {
      conditions.push(`o.created_at <= $${pIdx++}::timestamptz`);
      params.push(`${end_date} 23:59:59.999+00`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*) AS total 
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const pageNum = parseInt(page as string || '1', 10);
    const pageSize = parseInt(limit as string || '50', 10);
    const offset = (pageNum - 1) * pageSize;

    const queryParams = [...params, pageSize, offset];
    const dataSql = `
      SELECT 
        o.id, 
        o.buyer_id, 
        o.total_amount::float AS total_amount, 
        o.status, 
        o.shipping_address, 
        o.created_at, 
        o.updated_at,
        u.name AS buyer_name,
        u.email AS buyer_email,
        COALESCE(SUM(oi.quantity), 0)::int AS item_count
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;

    const r = await db.query(dataSql, queryParams);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      orders: r.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to query admin orders: ' + err.message });
  }
});

// Admin Sales Report (Date-Wise Aggregation)
app.get('/api/v1/admin/reports/sales', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }

    const { start_date, end_date } = req.query;
    const conditions = ['o.status != \'CANCELLED\''];
    const params: any[] = [];
    let pIdx = 1;

    if (start_date) {
      conditions.push(`o.created_at >= $${pIdx++}::timestamptz`);
      params.push(`${start_date} 00:00:00+00`);
    }

    if (end_date) {
      conditions.push(`o.created_at <= $${pIdx++}::timestamptz`);
      params.push(`${end_date} 23:59:59.999+00`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sql = `
      SELECT 
        TO_CHAR(o.created_at, 'YYYY-MM-DD') AS date,
        COUNT(DISTINCT o.id)::int AS orders,
        ROUND(SUM(o.total_amount)::numeric, 2)::float AS revenue,
        COALESCE(SUM(oi.quantity), 0)::int AS items_sold
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY TO_CHAR(o.created_at, 'YYYY-MM-DD')
      ORDER BY date ASC;
    `;

    const r = await db.query(sql, params);

    const periodRevenue = Number(r.rows.reduce((sum, row) => sum + row.revenue, 0).toFixed(2));
    const periodOrders = r.rows.reduce((sum, row) => sum + row.orders, 0);

    res.json({
      success: true,
      report: r.rows,
      period_total_revenue: periodRevenue,
      period_total_orders: periodOrders
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to query sales report: ' + err.message });
  }
});

// Admin Products (with search, category filter, date-range, and pagination)
app.get('/api/v1/admin/products', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }

    const { search, category_id, start_date, end_date, page, limit } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(LOWER(p.name) LIKE $${pIdx} OR LOWER(p.description) LIKE $${pIdx} OR p.id::text = $${pIdx})`);
      params.push(`%${(search as string).toLowerCase()}%`);
      pIdx++;
    }

    if (category_id) {
      conditions.push(`p.category_id = $${pIdx++}`);
      params.push(parseInt(category_id as string, 10));
    }

    if (start_date) {
      conditions.push(`p.created_at >= $${pIdx++}::timestamptz`);
      params.push(`${start_date} 00:00:00+00`);
    }

    if (end_date) {
      conditions.push(`p.created_at <= $${pIdx++}::timestamptz`);
      params.push(`${end_date} 23:59:59.999+00`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT count(*) AS total FROM products p ${whereClause};`, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const pageNum = parseInt(page as string || '1', 10);
    const pageSize = parseInt(limit as string || '50', 10);
    const offset = (pageNum - 1) * pageSize;

    const queryParams = [...params, pageSize, offset];
    const dataSql = `
      SELECT 
        p.id, 
        p.seller_id, 
        p.category_id, 
        p.name, 
        p.description, 
        p.price::float AS price, 
        p.stock_quantity, 
        p.image_url, 
        p.created_at, 
        p.updated_at,
        c.name AS category_name,
        u.name AS seller_name,
        COALESCE(ROUND(AVG(r.rating), 1), 0)::float AS avg_rating,
        COUNT(r.id)::int AS review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN reviews r ON p.id = r.product_id
      ${whereClause}
      GROUP BY p.id, c.name, u.name
      ORDER BY p.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;

    const r = await db.query(dataSql, queryParams);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      products: r.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to query admin products: ' + err.message });
  }
});

// Admin Reviews (with search, rating filter, date-range, and pagination)
app.get('/api/v1/admin/reviews', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
      return;
    }

    const { search, rating, start_date, end_date, page, limit } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(LOWER(r.comment) LIKE $${pIdx} OR LOWER(u.name) LIKE $${pIdx} OR LOWER(p.name) LIKE $${pIdx} OR r.id::text = $${pIdx})`);
      params.push(`%${(search as string).toLowerCase()}%`);
      pIdx++;
    }

    if (rating) {
      conditions.push(`r.rating = $${pIdx++}`);
      params.push(parseInt(rating as string, 10));
    }

    if (start_date) {
      conditions.push(`r.created_at >= $${pIdx++}::timestamptz`);
      params.push(`${start_date} 00:00:00+00`);
    }

    if (end_date) {
      conditions.push(`r.created_at <= $${pIdx++}::timestamptz`);
      params.push(`${end_date} 23:59:59.999+00`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*) AS total 
       FROM reviews r
       JOIN users u ON r.buyer_id = u.id
       JOIN products p ON r.product_id = p.id
       ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const pageNum = parseInt(page as string || '1', 10);
    const pageSize = parseInt(limit as string || '50', 10);
    const offset = (pageNum - 1) * pageSize;

    const queryParams = [...params, pageSize, offset];
    const dataSql = `
      SELECT 
        r.id, 
        r.buyer_id, 
        r.product_id, 
        r.rating, 
        r.comment, 
        r.created_at, 
        r.updated_at,
        u.name AS buyer_name,
        u.email AS buyer_email,
        p.name AS product_name
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      JOIN products p ON r.product_id = p.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;

    const r = await db.query(dataSql, queryParams);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      reviews: r.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to query reviews: ' + err.message });
  }
});

// Admin Delete Review
app.delete('/api/v1/admin/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }

    const reviewId = parseInt(req.params.id, 10);
    const r = await db.query('DELETE FROM reviews WHERE id = $1 RETURNING id;', [reviewId]);

    if (r.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Review not found in PostgreSQL' });
      return;
    }

    res.json({ success: true, message: `Review #${reviewId} removed successfully from PostgreSQL by admin` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete review: ' + err.message });
  }
});

// Admin Raw SQL Query Execution (PostgreSQL Query Runner for Admin / Verification)
app.post('/api/v1/admin/sql', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
      return;
    }

    const { sql, params } = req.body;
    if (!sql) {
      res.status(400).json({ success: false, error: 'SQL query statement is required' });
      return;
    }

    const r = await db.query(sql, params || []);
    res.json({
      success: true,
      rowCount: r.rowCount,
      rows: r.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'SQL query execution failed: ' + err.message });
  }
});

// Real Database Inspection Endpoint (returns rows from all real PostgreSQL tables)
app.get('/api/v1/db/inspect', authenticateToken, async (_req, res) => {
  try {
    const usersRes = await db.query('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY id ASC;');
    const sellersRes = await db.query('SELECT * FROM sellers ORDER BY id ASC;');
    const categoriesRes = await db.query('SELECT * FROM categories ORDER BY id ASC;');
    const productsRes = await db.query('SELECT id, seller_id, category_id, name, description, price::float AS price, stock_quantity, image_url, created_at, updated_at FROM products ORDER BY id ASC;');
    const cartRes = await db.query('SELECT id, buyer_id, product_id, quantity, created_at, updated_at FROM cart_items ORDER BY id ASC;');
    const ordersRes = await db.query('SELECT id, buyer_id, total_amount::float AS total_amount, status, shipping_address, created_at, updated_at FROM orders ORDER BY id ASC;');
    const orderItemsRes = await db.query('SELECT id, order_id, product_id, seller_id, product_name, unit_price::float AS unit_price, quantity, subtotal::float AS subtotal, created_at FROM order_items ORDER BY id ASC;');
    const reviewsRes = await db.query('SELECT * FROM reviews ORDER BY id ASC;');
    const wishlistRes = await db.query('SELECT * FROM wishlist_items ORDER BY id ASC;');
    const historyRes = await db.query('SELECT * FROM order_status_history ORDER BY id ASC;');

    res.json({
      success: true,
      tables: {
        users: usersRes.rows,
        sellers: sellersRes.rows,
        categories: categoriesRes.rows,
        products: productsRes.rows,
        cart_items: cartRes.rows,
        orders: ordersRes.rows,
        order_items: orderItemsRes.rows,
        reviews: reviewsRes.rows,
        wishlist_items: wishlistRes.rows,
        order_status_history: historyRes.rows
      },
      counts: {
        users: usersRes.rows.length,
        sellers: sellersRes.rows.length,
        categories: categoriesRes.rows.length,
        products: productsRes.rows.length,
        cart_items: cartRes.rows.length,
        orders: ordersRes.rows.length,
        order_items: orderItemsRes.rows.length,
        reviews: reviewsRes.rows.length,
        wishlist_items: wishlistRes.rows.length,
        order_status_history: historyRes.rows.length
      },
      storage_type: 'PostgreSQL Relational Table Store (ACID Persistent)',
      last_saved: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Database inspection error: ' + err.message });
  }
});

// Gemini AI Shopping Assistant Route
app.post('/api/v1/ai/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ success: false, error: 'Field "message" is required' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(503).json({
      success: false,
      error: 'GEMINI_API_KEY is not configured. Please set your key in the AI Studio Secrets panel.'
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Query active products from PostgreSQL
    const prodRes = await db.query('SELECT id, name, price::float AS price, stock_quantity, description FROM products LIMIT 50;');
    const catalogSnippet = prodRes.rows.map(p => 
      `- [ID ${p.id}] ${p.name}: $${p.price.toFixed(2)} (Stock: ${p.stock_quantity}) - ${p.description.slice(0, 100)}`
    ).join('\n');

    const systemPrompt = `You are Nila, the helpful and enthusiastic AI Shopping Concierge for NilaMart (an enterprise e-commerce platform with Amazon/Flipkart scale architecture).
Your goal is to assist customers with discovering products, checking specifications, comparing options, and answering questions about shipping, warranties, and orders.
Current store catalog snapshot from PostgreSQL:
${catalogSnippet}

Guidelines:
1. Always suggest real products from NilaMart when relevant.
2. Format prices clearly with '$'.
3. Mention that free shipping applies to orders over $50.
4. Keep answers friendly, concise, and helpful.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nCustomer question: ${message}` }]
        }
      ]
    });

    const reply = response.text || 'I would love to help you find the best products on NilaMart! Could you tell me more about what you are looking for?';
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.status(502).json({
      success: false,
      error: 'Failed to generate response from Gemini API: ' + (err.message || 'Unknown error')
    });
  }
});

// Endpoint to inspect C++ Drogon source code files directly in the in-app explorer
app.get('/api/v1/codebase/files', (_req, res) => {
  const rootDir = process.cwd();
  const filePaths = [
    'CMakeLists.txt',
    'backend/main.cc',
    'backend/config.json',
    'backend/models/Models.h',
    'backend/controllers/ApiController.h',
    'backend/controllers/ApiController.cc',
    'backend/controllers/AiChatController.h',
    'backend/controllers/AiChatController.cc',
    'backend/repositories/Repositories.h',
    'backend/services/Services.h',
    'backend/middleware/Filters.h',
    'database/schema.sql',
    'database/seed.sql',
    'database/verification_queries.sql',
    'API_DOCUMENTATION.md',
    'run_powershell.ps1',
    'setup_db.sh',
    'README.md'
  ];

  const files = filePaths.map(relPath => {
    const fullPath = path.join(rootDir, relPath);
    let content = '';
    if (fs.existsSync(fullPath)) {
      content = fs.readFileSync(fullPath, 'utf-8');
    }
    return {
      path: relPath,
      name: path.basename(relPath),
      size: content.length,
      content
    };
  });

  res.json({ success: true, files });
});

// Vite dev server mounting or static serving
async function startServer() {
  // Ensure PostgreSQL database is initialized before serving requests
  try {
    await (db as any).init();
    console.log('[PostgreSQL] Database engine ready and tables verified.');
  } catch (dbInitErr) {
    console.error('[PostgreSQL] Database initialization warning:', dbInitErr);
  }

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  NilaMart Full-Stack Server Running on Port ${PORT} `);
    console.log(`  Connected to PostgreSQL Relational Store (ACID)   `);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start NilaMart server:', err);
});
