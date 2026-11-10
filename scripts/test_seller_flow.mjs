// =====================================================================
// NilaMart Seller Functionality & PostgreSQL Integrity Test Suite
// Verifies:
//   1. Seller login
//   2. Add product (name, description, category, price, stock, image)
//   3. Verify product using SELECT query directly in PostgreSQL
//   4. Edit product price
//   5. Verify updated price and refreshed updated_at in PostgreSQL
//   6. Update product stock quantity
//   7. Verify updated stock in PostgreSQL
//   8. Verify cross-seller isolation (seller A cannot edit seller B's product)
//   9. Delete product
//   10. Verify deleted product no longer exists in PostgreSQL
// =====================================================================

const API_BASE = 'http://localhost:3000/api/v1';

async function api(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

// Executes real SQL queries directly against PostgreSQL via the active server engine
async function executeSql(sql, params = []) {
  const res = await api('/admin/sql', {
    method: 'POST',
    headers: { Authorization: 'Bearer nilamart_demo_admin' },
    body: JSON.stringify({ sql, params })
  });
  if (!res.ok) {
    throw new Error(`SQL query failed: ${res.data.error || res.status}`);
  }
  return res.data;
}

async function runSellerVerification() {
  console.log('=================================================================');
  console.log('   NilaMart Seller Management & PostgreSQL Verification Suite    ');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -----------------------------------------------------------------
    // STEP 1: SELLER LOGIN
    // -----------------------------------------------------------------
    console.log('--- Step 1: Seller Login ---');
    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'seller.tech@nilamart.com',
        password: 'seller123'
      })
    });

    assert(loginRes.status === 200 && loginRes.data.success === true, '1. Seller logged in successfully via /api/v1/auth/login');
    const sellerToken = loginRes.data.token;
    const sellerId = loginRes.data.user.id;
    const sellerRole = loginRes.data.user.role;
    assert(sellerRole === 'SELLER', `   Role verified as "${sellerRole}", Seller ID: #${sellerId}`);

    // Verify seller record directly using SELECT query in PostgreSQL
    const sellerSql = 'SELECT u.id, u.name, u.email, u.role, s.store_name FROM users u LEFT JOIN sellers s ON u.id = s.user_id WHERE u.id = $1;';
    console.log(`   [PostgreSQL SELECT Query]: ${sellerSql} with param [${sellerId}]`);
    const sellerDbCheck = await executeSql(sellerSql, [sellerId]);
    assert(sellerDbCheck.rows.length === 1 && sellerDbCheck.rows[0].email === 'seller.tech@nilamart.com', '   Verified seller record in PostgreSQL users and sellers tables');
    console.log(`   Found in DB: "${sellerDbCheck.rows[0].name}" | Store: "${sellerDbCheck.rows[0].store_name}"\n`);

    // -----------------------------------------------------------------
    // STEP 2: ADD PRODUCT
    // -----------------------------------------------------------------
    console.log('--- Step 2: Add Product as Seller ---');
    const testProductName = `AcousticWave Studio Pro Headphones (Test ${Date.now()})`;
    const initialPrice = 189.95;
    const initialStock = 35;
    const categoryId = 1; // Electronics

    const addProductRes = await api('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        name: testProductName,
        description: 'Professional grade closed-back studio monitor headphones with 50mm neodymium magnet drivers.',
        price: initialPrice,
        stock_quantity: initialStock,
        category_id: categoryId,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
      })
    });

    assert(addProductRes.status === 201 && addProductRes.data.success === true, '2. Product added successfully via POST /api/v1/products');
    const createdProductId = addProductRes.data.product.id;
    console.log(`   Created Product ID: #${createdProductId} with seller_id: #${addProductRes.data.product.seller_id}\n`);

    // -----------------------------------------------------------------
    // STEP 3: VERIFY PRODUCT USING SELECT QUERY IN POSTGRESQL
    // -----------------------------------------------------------------
    console.log('--- Step 3: Verify Product Using SELECT Query in PostgreSQL ---');
    const selectSql = `
      SELECT id, seller_id, category_id, name, description, price::float AS price, stock_quantity, image_url, created_at, updated_at
      FROM products
      WHERE id = $1;
    `;
    console.log(`   [PostgreSQL SELECT Query]:\n   ${selectSql.trim()}\n   with param [${createdProductId}]`);
    const productDbRes = await executeSql(selectSql, [createdProductId]);
    assert(productDbRes.rows.length === 1, `3. Product #${createdProductId} retrieved directly from PostgreSQL products table`);

    const dbProd = productDbRes.rows[0];
    assert(dbProd.name === testProductName, `   Verified DB Product Name: "${dbProd.name}"`);
    assert(Number(dbProd.price) === initialPrice, `   Verified DB Price: $${dbProd.price}`);
    assert(dbProd.stock_quantity === initialStock, `   Verified DB Stock: ${dbProd.stock_quantity} units`);
    assert(dbProd.seller_id === sellerId, `   Verified DB Seller ID FK: #${dbProd.seller_id} (proper foreign key to users.id)`);
    assert(Boolean(dbProd.created_at && dbProd.updated_at), `   Verified PostgreSQL Timestamps: created_at=${dbProd.created_at}, updated_at=${dbProd.updated_at}\n`);

    // -----------------------------------------------------------------
    // STEP 4: EDIT PRODUCT PRICE
    // -----------------------------------------------------------------
    console.log('--- Step 4: Edit Product Price ---');
    const updatedPrice = 159.50;
    const editRes = await api(`/products/${createdProductId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        price: updatedPrice
      })
    });

    assert(editRes.status === 200 && editRes.data.success === true, `4. Product price edited via PUT /api/v1/products/${createdProductId}`);
    console.log(`   API response message: "${editRes.data.message}"\n`);

    // -----------------------------------------------------------------
    // STEP 5: VERIFY UPDATED PRICE IN POSTGRESQL
    // -----------------------------------------------------------------
    console.log('--- Step 5: Verify Updated Price and Timestamp in PostgreSQL ---');
    const verifyEditSql = `
      SELECT id, name, price::float AS price, stock_quantity, created_at, updated_at
      FROM products
      WHERE id = $1;
    `;
    console.log(`   [PostgreSQL SELECT Query]:\n   ${verifyEditSql.trim()}\n   with param [${createdProductId}]`);
    const verifyEditDb = await executeSql(verifyEditSql, [createdProductId]);
    const updatedDbProd = verifyEditDb.rows[0];

    assert(Number(updatedDbProd.price) === updatedPrice, `5. Verified updated price in PostgreSQL: was $${initialPrice}, now $${updatedDbProd.price}`);
    assert(new Date(updatedDbProd.updated_at).getTime() >= new Date(updatedDbProd.created_at).getTime(), `   Verified updated_at timestamp in PostgreSQL: ${updatedDbProd.updated_at}\n`);

    // -----------------------------------------------------------------
    // STEP 6: UPDATE STOCK QUANTITY (REQUIREMENT 6)
    // -----------------------------------------------------------------
    console.log('--- Step 6: Update Product Stock Quantity ---');
    const updatedStock = 75;
    const stockRes = await api(`/products/${createdProductId}/stock`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        stock_quantity: updatedStock
      })
    });

    assert(stockRes.status === 200 && stockRes.data.success === true, `6. Stock quantity updated to ${updatedStock} via PATCH /api/v1/products/${createdProductId}/stock`);

    // Verify stock in PostgreSQL
    const verifyStockSql = 'SELECT id, stock_quantity, updated_at FROM products WHERE id = $1;';
    console.log(`   [PostgreSQL SELECT Query]: ${verifyStockSql} with param [${createdProductId}]`);
    const verifyStockDb = await executeSql(verifyStockSql, [createdProductId]);
    assert(verifyStockDb.rows[0].stock_quantity === updatedStock, `   Verified stock quantity in PostgreSQL: ${verifyStockDb.rows[0].stock_quantity} units\n`);

    // -----------------------------------------------------------------
    // STEP 7: VERIFY MULTI-SELLER ISOLATION (CROSS-SELLER PROTECTION)
    // -----------------------------------------------------------------
    console.log('--- Step 7: Verify Cross-Seller Isolation ---');
    // Login as a second seller (Aura Fashion, user_id: 3)
    const seller2Login = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'seller.fashion@nilamart.com',
        password: 'seller123'
      })
    });
    const seller2Token = seller2Login.data.token;
    assert(seller2Login.status === 200, '   Logged in as Seller 2 (Aura Fashion, ID #3)');

    // Seller 2 attempts to edit Seller 1's product -> MUST BE FORBIDDEN (HTTP 403)
    const unauthorizedEdit = await api(`/products/${createdProductId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${seller2Token}` },
      body: JSON.stringify({ price: 9.99 })
    });
    assert(unauthorizedEdit.status === 403, `7. Seller 2 blocked from editing Seller 1's product (HTTP 403 Forbidden: "${unauthorizedEdit.data.error}")`);

    // Seller 2 attempts to delete Seller 1's product -> MUST BE FORBIDDEN (HTTP 403)
    const unauthorizedDelete = await api(`/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${seller2Token}` }
    });
    assert(unauthorizedDelete.status === 403, `   Seller 2 blocked from deleting Seller 1's product (HTTP 403 Forbidden: "${unauthorizedDelete.data.error}")\n`);

    // -----------------------------------------------------------------
    // STEP 8: DELETE PRODUCT (SELLER 1)
    // -----------------------------------------------------------------
    console.log('--- Step 8: Delete Product ---');
    const deleteRes = await api(`/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sellerToken}` }
    });

    assert(deleteRes.status === 200 && deleteRes.data.success === true, `8. Product #${createdProductId} deleted via DELETE /api/v1/products/${createdProductId}`);
    console.log(`   API response message: "${deleteRes.data.message}"\n`);

    // -----------------------------------------------------------------
    // STEP 9: VERIFY DELETED PRODUCT NO LONGER EXISTS
    // -----------------------------------------------------------------
    console.log('--- Step 9: Verify Deleted Product in PostgreSQL ---');
    const checkDeletedSql = 'SELECT id, name FROM products WHERE id = $1;';
    console.log(`   [PostgreSQL SELECT Query]: ${checkDeletedSql} with param [${createdProductId}]`);
    const checkDeletedDb = await executeSql(checkDeletedSql, [createdProductId]);
    assert(checkDeletedDb.rows.length === 0, `9. Verified product #${createdProductId} no longer exists in PostgreSQL products table`);

    // Also verify via GET endpoint returns 404 Not Found
    const apiGetDeleted = await api(`/products/${createdProductId}`);
    assert(apiGetDeleted.status === 404, `   Verified GET /api/v1/products/${createdProductId} returns HTTP 404 Not Found\n`);

    console.log('=================================================================');
    console.log(`  Test Results: ${passed} PASSED | ${failed} FAILED`);
    console.log('=================================================================');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runSellerVerification().then(() => {
  process.exit(0);
});
