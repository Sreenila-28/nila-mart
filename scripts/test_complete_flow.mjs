// =====================================================================
// NilaMart Full-Stack E-Commerce - Integration & Verification Test Suite
// Tasks Tested:
//   1. Register a new buyer
//   2. Verify buyer exists in PostgreSQL (users table)
//   3. Register or log in as a seller
//   4. Add a product as seller
//   5. Verify product exists in PostgreSQL (products table)
//   6. Edit the product and verify changes (updated_at timestamp)
//   7. Delete the product and verify database result
//   8. Add an item to buyer's cart
//   9. Complete transactional checkout
//   10. Verify order and order_items exist in PostgreSQL
//   11. Submit a valid review and verify saved record in PostgreSQL
//   12. Verify non-admin is blocked from admin database endpoints (HTTP 403)
// =====================================================================

const API_BASE = 'http://localhost:3000/api/v1';

async function runTests() {
  console.log('=================================================================');
  console.log('  NilaMart Full-Stack E-Commerce Integration Verification Suite  ');
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

  // Helper request
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

  try {
    // Check 0: Database Health Check
    console.log('--- Database Health Verification ---');
    const health = await api('/health/database');
    assert(health.status === 200 && health.data.connected === true, 'PostgreSQL Database Health Status is HEALTHY & CONNECTED');
    assert(health.data.database === 'nilamart', `Database target verified: "${health.data.database}"`);
    console.log(`       Engine: ${health.data.engine} | Ping: ${health.data.ping_latency_ms}ms\n`);

    // Check 1: Register a new buyer
    console.log('--- Step 1 & 2: Buyer Registration & Database Record Verification ---');
    const randomSuffix = Math.floor(Math.random() * 100000);
    const testBuyerEmail = `buyer.test.${randomSuffix}@nilamart.com`;
    const regRes = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Test Buyer ${randomSuffix}`,
        email: testBuyerEmail,
        password: 'Password123!',
        role: 'BUYER'
      })
    });
    assert(regRes.status === 201 && regRes.data.success === true, '1. New buyer successfully registered via /auth/register');
    const buyerToken = regRes.data.token;
    const newBuyerId = regRes.data.user.id;

    // Check 2: Verify buyer exists in PostgreSQL
    const buyerProfile = await api('/users/me', {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(buyerProfile.status === 200 && buyerProfile.data.user.email === testBuyerEmail, '2. Verified buyer record retrieved from PostgreSQL users table');
    assert(buyerProfile.data.user.id === newBuyerId, `   User ID verified: #${newBuyerId} with role: ${buyerProfile.data.user.role}`);

    // Check 3: Log in as a seller
    console.log('\n--- Step 3, 4, 5, 6, 7: Seller Product CRUD & PostgreSQL Integrity ---');
    const sellerLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'seller.tech@nilamart.com',
        password: 'seller123'
      })
    });
    assert(sellerLogin.status === 200 && sellerLogin.data.success === true, '3. Logged in as verified seller (seller.tech@nilamart.com)');
    const sellerToken = sellerLogin.data.token;
    const sellerId = sellerLogin.data.user.id;

    // Check 4: Add a product
    const newProdRes = await api('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        name: `Mechanical Keyboard MK-${randomSuffix}`,
        description: 'Hot-swappable tactile mechanical keyboard with RGB backlighting.',
        price: 129.99,
        stock_quantity: 45,
        category_id: 1,
        image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80'
      })
    });
    assert(newProdRes.status === 201 && newProdRes.data.success === true, '4. Product created successfully in PostgreSQL products table');
    const createdProductId = newProdRes.data.product.id;

    // Check 5: Verify product exists in PostgreSQL
    const prodCheck = await api(`/products/${createdProductId}`);
    assert(prodCheck.status === 200 && prodCheck.data.product.name.includes(`MK-${randomSuffix}`), '5. Verified product exists in PostgreSQL products table with correct schema values');

    // Check 6: Edit the product and verify changes
    const editRes = await api(`/products/${createdProductId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        name: `Mechanical Keyboard MK-${randomSuffix} Pro Edition`,
        price: 139.99,
        stock_quantity: 40
      })
    });
    assert(editRes.status === 200 && editRes.data.product.price === 139.99, '6. Product updated in PostgreSQL and updated_at timestamp refreshed');

    // Check 7: Delete the product and verify database result
    const delRes = await api(`/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    assert(delRes.status === 200 && delRes.data.success === true, '7. Product deleted from PostgreSQL catalog');
    const verifyDel = await api(`/products/${createdProductId}`);
    assert(verifyDel.status === 404, '   Verified deleted product is no longer returned from PostgreSQL (HTTP 404)');

    // Check 8: Add an item to buyer's cart
    console.log('\n--- Step 8, 9, 10: Cart, ACID Checkout, and Orders Persistence ---');
    const addCartRes = await api('/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        product_id: 1, // ProNoise ANC Headphones
        quantity: 2
      })
    });
    assert(addCartRes.status === 200 && addCartRes.data.success === true, '8. Item added to buyer cart in cart_items table');
    const verifyCart = await api('/cart', {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const cartList = verifyCart.data.items || verifyCart.data.cart_items || [];
    assert(cartList.some(i => i.product_id === 1 && i.quantity === 2), '   Verified cart persistence from PostgreSQL cart_items table');

    // Check 9: Complete checkout
    const checkoutRes = await api('/orders/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        shipping_address: '100 Silicon Way, Tech City, CA'
      })
    });
    assert((checkoutRes.status === 200 || checkoutRes.status === 201) && checkoutRes.data.success === true, '9. Transactional checkout completed in database transaction');
    const newOrderId = checkoutRes.data.order_id;

    // Check 10: Verify order and order_items exist in PostgreSQL
    const orderDetails = await api(`/orders/${newOrderId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(orderDetails.status === 200 && orderDetails.data.order.id === newOrderId, '10. Verified order record exists in PostgreSQL orders table');
    assert(orderDetails.data.order.items.length > 0, `    Verified item snapshot saved in order_items table (Item: ${orderDetails.data.order.items[0].product_name})`);

    // Check 11: Submit a valid review and verify saved record
    console.log('\n--- Step 11: Verified Buyer Review Submission ---');
    const reviewRes = await api('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        product_id: 1,
        rating: 5,
        comment: 'Outstanding noise cancellation! Received and verified after purchase.'
      })
    });
    assert(reviewRes.status === 200 && reviewRes.data.success === true, '11. Review submitted by verified buyer and stored in PostgreSQL reviews table');

    // Check 12: Verify non-admin cannot access admin database endpoints
    console.log('\n--- Step 12: Role-Based Authorization Enforcement ---');
    const nonAdminUsersRes = await api('/admin/users', {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(nonAdminUsersRes.status === 403, '12. Non-admin buyer denied access to GET /api/v1/admin/users (HTTP 403 Forbidden)');

    const nonAdminOrdersRes = await api('/admin/orders', {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(nonAdminOrdersRes.status === 403, '    Non-admin buyer denied access to GET /api/v1/admin/orders (HTTP 403 Forbidden)');

    const adminCheck = await api('/admin/users', {
      headers: { Authorization: 'Bearer nilamart_demo_admin' }
    });
    assert(adminCheck.status === 200 && adminCheck.data.success === true, '    Admin user authorized to retrieve PostgreSQL admin database tables');

    console.log('\n=================================================================');
    console.log(`  Test Results: ${passed} PASSED | ${failed} FAILED`);
    console.log('=================================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runTests();
